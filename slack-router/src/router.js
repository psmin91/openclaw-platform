const http = require('http');
const https = require('https');
const { getUserMapping } = require('./dynamodb');

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN || '';
const DEFAULT_PORT = Number(process.env.OPENCLAW_PORT) || 3000;

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
    // Unknown user — optionally send a help message
    await postSlackMessage(
      event.channel,
      '🔒 You don\'t have an OpenClaw instance assigned yet. Contact your admin.'
    );
    return { ok: true, message: 'User not mapped' };
  }

  // Forward to OpenClaw instance
  const port = mapping.openclaw_port || DEFAULT_PORT;
  const instanceUrl = `http://${mapping.instance_ip}:${port}/slack/events`;

  console.log(`Routing ${slackUserId} → ${instanceUrl}`);

  try {
    const result = await forwardToInstance(instanceUrl, payload);
    console.log(`Forward response: ${result.statusCode}`);

    // If instance returns a response message, post it to Slack
    if (result.body?.text) {
      await postSlackMessage(event.channel, result.body.text);
    }

    return { ok: true, routed_to: mapping.instance_id };
  } catch (err) {
    console.error(`Forward failed for ${slackUserId}:`, err.message);
    await postSlackMessage(
      event.channel,
      '⚠️ Your OpenClaw instance is currently unavailable. It may be starting up.'
    );
    return { ok: false, error: 'Forward failed' };
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
      },
      timeout: 25000, // Lambda has 30s timeout, leave margin
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
