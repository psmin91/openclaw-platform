const crypto = require('crypto');

const SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET || '';

/**
 * Verify Slack request signature (v0).
 * https://api.slack.com/authentication/verifying-requests-from-slack
 */
function verifySlackRequest(headers, rawBody) {
  if (!SIGNING_SECRET) {
    console.warn('SLACK_SIGNING_SECRET not set, skipping verification');
    return true;
  }

  const timestamp = headers['x-slack-request-timestamp'];
  const signature = headers['x-slack-signature'];

  if (!timestamp || !signature) return false;

  // Reject requests older than 5 minutes (replay attack prevention)
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - Number(timestamp)) > 300) {
    console.warn('Request timestamp too old');
    return false;
  }

  const sigBaseString = `v0:${timestamp}:${rawBody}`;
  const mySignature = 'v0=' + crypto
    .createHmac('sha256', SIGNING_SECRET)
    .update(sigBaseString, 'utf8')
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(mySignature, 'utf8'),
    Buffer.from(signature, 'utf8')
  );
}

module.exports = { verifySlackRequest };
