const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const TABLE_NAME = process.env.DYNAMODB_TABLE || 'openclaw-user-mappings';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

/**
 * Look up user mapping by Slack user ID.
 * @param {string} slackUserId
 * @returns {Promise<{slack_user_id, user_id, instance_id, instance_ip, openclaw_port, status}|null>}
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

  // Allow 'active' and 'starting' statuses to proceed
  if (Item.status !== 'active' && Item.status !== 'starting') {
    console.log(`User ${slackUserId} is ${Item.status}, not routing`);
    return null;
  }

  return Item;
}

/**
 * Update the status field for a user mapping.
 * @param {string} slackUserId
 * @param {string} status
 */
async function updateMappingStatus(slackUserId, status) {
  try {
    await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { slack_user_id: slackUserId },
      UpdateExpression: 'SET #s = :status, updated_at = :now',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: {
        ':status': status,
        ':now': new Date().toISOString(),
      },
    }));
  } catch (err) {
    console.error(`Failed to update status for ${slackUserId}:`, err.message);
  }
}

module.exports = { getUserMapping, updateMappingStatus };
