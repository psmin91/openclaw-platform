const { verifySlackRequest } = require('./slack-verify');
const { routeEvent } = require('./router');
const { handleHealth } = require('./health');

/**
 * Lambda handler for Slack Events API via API Gateway HTTP API (v2).
 */
exports.handler = async (event) => {
  const { rawPath, requestContext, body, headers } = event;

  // Health check
  if (rawPath === '/health' || requestContext?.http?.method === 'GET') {
    return handleHealth();
  }

  // Parse body
  let payload;
  try {
    payload = JSON.parse(body || '{}');
  } catch {
    return response(400, { error: 'Invalid JSON' });
  }

  // Slack URL verification challenge
  if (payload.type === 'url_verification') {
    return response(200, { challenge: payload.challenge });
  }

  // Verify Slack signature
  if (!verifySlackRequest(headers, body)) {
    console.warn('Slack signature verification failed');
    return response(401, { error: 'Invalid signature' });
  }

  // Route the event
  try {
    const result = await routeEvent(payload);
    return response(200, result);
  } catch (err) {
    console.error('Router error:', err);
    return response(500, { error: 'Internal server error' });
  }
};

function response(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}
