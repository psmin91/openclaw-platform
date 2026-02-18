const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');

const TABLE_NAME = process.env.DYNAMODB_TABLE || 'openclaw-user-mappings';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

/**
 * Look up user mapping by Slack user ID.
 * @param {string} slackUserId
 * @returns {Promise<{user_id, instance_id, instance_ip, openclaw_port, status}|null>}
 */
async function getUserMapping(slackUserId) {
  const { Item } = await docClient.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: { slack_user_id: slackUserId },
  }));

  if (!Item) {
    console.log(`No mapping found for Slack user: ${slackUserId}`);
    return null;
  }

  if (Item.status !== 'active') {
    console.log(`User ${slackUserId} is ${Item.status}, not routing`);
    return null;
  }

  return Item;
}

module.exports = { getUserMapping };
