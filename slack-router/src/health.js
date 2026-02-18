function handleHealth() {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: 'ok',
      service: 'openclaw-slack-router',
      timestamp: new Date().toISOString(),
    }),
  };
}

module.exports = { handleHealth };
