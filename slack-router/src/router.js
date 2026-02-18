const http = require('http');
const https = require('https');
const { getUserMapping, updateMappingStatus } = require('./dynamodb');
const { EC2Client, DescribeInstancesCommand, StartInstancesCommand } = require('@aws-sdk/client-ec2');

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN || '';
const DEFAULT_PORT = Number(process.env.OPENCLAW_PORT) || 3000;

const ec2 = new EC2Client({});

/**
 * Response ownership: PASSTHROUGH mode
 * ─────────────────────────────────────
 * The router forwards Slack events to OpenClaw instances.
 * OpenClaw handles the conversation directly via Slack API (using SLACK_BOT_TOKEN).
 * The router ONLY posts messages for infrastructure concerns:
 *   - User not mapped
 *   - Instance starting up (auto-start)
 *   - Instance unreachable
 *
 * OpenClaw instances must have SLACK_BOT_TOKEN to respond directly.
 * This prevents duplicate responses.
 */

/**
 * Route a Slack event to the correct OpenClaw instance.
 */
async function routeEvent(payload) {
  const { event } = payload;

  if (!event) {
    return { ok: true, message: 'No event to process' };
  }

  // Skip bot messages to prevent loops
  if (event.bot_id || event.subtype === 'bot_message') {
    return { ok: true, message: 'Skipped bot message' };
  }

  const slackUserId = event.user;
  if (!slackUserId) {
    console.warn('Event missing user field:', event.type);
    return { ok: true, message: 'No user in event' };
  }

  // Look up which instance handles this user
  const mapping = await getUserMapping(slackUserId);
  if (!mapping) {
    await postSlackMessage(
      event.channel,
      '🔒 You don\'t have an OpenClaw instance assigned yet. Contact your admin.'
    );
    return { ok: true, message: 'User not mapped' };
  }

  // ── Auto-start: check if instance is stopped ──────────────────────────────
  const instanceState = await getInstanceState(mapping.instance_id);

  if (instanceState === 'stopped' || instanceState === 'stopping') {
    console.log(`Instance ${mapping.instance_id} is ${instanceState}, auto-starting...`);

    try {
      await ec2.send(new StartInstancesCommand({
        InstanceIds: [mapping.instance_id],
      }));

      await updateMappingStatus(slackUserId, 'starting');

      await postSlackMessage(
        event.channel,
        '🚀 인스턴스를 시작하고 있습니다. 잠시만 기다려주세요... (약 1-2분 소요)\n' +
        '메시지를 다시 보내주시면 자동으로 전달됩니다.'
      );

      return { ok: true, message: 'Instance auto-starting', instance_id: mapping.instance_id };
    } catch (err) {
      console.error(`Auto-start failed for ${mapping.instance_id}:`, err.message);
      await postSlackMessage(
        event.channel,
        '⚠️ 인스턴스 시작에 실패했습니다. 관리자에게 문의하세요.'
      );
      return { ok: false, error: 'Auto-start failed' };
    }
  }

  if (instanceState === 'pending') {
    await postSlackMessage(
      event.channel,
      '⏳ 인스턴스가 시작 중입니다. 잠시 후 다시 시도해주세요...'
    );
    return { ok: true, message: 'Instance still starting' };
  }

  if (instanceState !== 'running' && instanceState !== null) {
    await postSlackMessage(
      event.channel,
      `⚠️ 인스턴스 상태: ${instanceState}. 관리자에게 문의하세요.`
    );
    return { ok: false, error: `Instance state: ${instanceState}` };
  }

  // ── Forward to OpenClaw instance (passthrough) ────────────────────────────
  const port = mapping.openclaw_port || DEFAULT_PORT;
  const instanceIp = mapping.instance_ip;
  const instanceUrl = `http://${instanceIp}:${port}/slack/events`;

  console.log(`Routing ${slackUserId} → ${instanceUrl}`);

  try {
    const result = await forwardToInstance(instanceUrl, payload);
    console.log(`Forward response: ${result.statusCode}`);

    // Passthrough: OpenClaw responds directly to Slack.
    // Router does NOT relay OpenClaw's response to avoid duplication.

    return { ok: true, routed_to: mapping.instance_id };
  } catch (err) {
    console.error(`Forward failed for ${slackUserId}:`, err.message);
    await postSlackMessage(
      event.channel,
      '⚠️ OpenClaw 인스턴스에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.'
    );
    return { ok: false, error: 'Forward failed' };
  }
}

/**
 * Check EC2 instance state via AWS API.
 * @returns {Promise<string|null>} running, stopped, pending, etc. or null if not found
 */
async function getInstanceState(instanceId) {
  if (!instanceId) return null;

  try {
    const { Reservations } = await ec2.send(new DescribeInstancesCommand({
      InstanceIds: [instanceId],
    }));

    const instance = Reservations?.[0]?.Instances?.[0];
    return instance?.State?.Name || null;
  } catch (err) {
    console.error(`Failed to get instance state for ${instanceId}:`, err.message);
    return null;
  }
}

/**
 * Forward the Slack payload to an OpenClaw instance via HTTP.
 */
function forwardToInstance(url, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const urlObj = new URL(url);

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'X-Forwarded-By': 'openclaw-router',
      },
      timeout: 25000,
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        let parsed;
        try { parsed = JSON.parse(body); } catch { parsed = { raw: body }; }
        resolve({ statusCode: res.statusCode, body: parsed });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.write(data);
    req.end();
  });
}

/**
 * Post a message to Slack via chat.postMessage API.
 * Used ONLY for router-level messages (not OpenClaw responses).
 */
async function postSlackMessage(channel, text) {
  if (!SLACK_BOT_TOKEN || !channel) return;

  const data = JSON.stringify({ channel, text });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'slack.com',
      path: '/api/chat.postMessage',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SLACK_BOT_TOKEN}`,
        'Content-Length': Buffer.byteLength(data),
      },
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => resolve(body));
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

module.exports = { routeEvent };
