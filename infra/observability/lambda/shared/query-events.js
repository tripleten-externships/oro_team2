import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb'

const MAX_RECORDS = 50000
const SHARD_COUNT = 4
const client = DynamoDBDocumentClient.from(new DynamoDBClient({}))

class QueryLimitError extends Error {
  constructor() {
    super('The requested range is too large. Choose a narrower range.')
    this.name = 'QueryLimitError'
  }
}

function assertDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) {
    throw new Error('Dates must use YYYY-MM-DD format.')
  }

  const parsed = Date.parse(`${value}T00:00:00.000Z`)
  if (!Number.isFinite(parsed) || new Date(parsed).toISOString().slice(0, 10) !== value) {
    throw new Error('Date is invalid.')
  }
  return parsed
}

function getDateRange(from, to) {
  const start = assertDate(from)
  const end = assertDate(to)
  if (start > end) {
    throw new Error('The start date must be before the end date.')
  }

  const days = Math.floor((end - start) / 86400000) + 1
  if (days > 31) {
    throw new QueryLimitError()
  }

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(start + (index * 86400000))
    return date.toISOString().slice(0, 10)
  })
}

async function queryEvents({ from, to, tableName = process.env.EVENTS_TABLE_NAME }) {
  const days = getDateRange(from, to)
  const records = []

  for (const day of days) {
    for (let shard = 0; shard < SHARD_COUNT; shard += 1) {
      let exclusiveStartKey
      do {
        const response = await client.send(new QueryCommand({
          ExclusiveStartKey: exclusiveStartKey,
          ExpressionAttributeNames: {
            '#expires': 'expiresAt',
            '#partition': 'GSI1PK',
            '#sort': 'GSI1SK',
          },
          ExpressionAttributeValues: {
            ':end': `${to}T23:59:59.999Z\uffff`,
            ':now': Math.floor(Date.now() / 1000),
            ':partitionValue': `DAY#${day}#SHARD#${String(shard).padStart(2, '0')}`,
            ':start': `${from}T00:00:00.000Z`,
          },
          FilterExpression: '#expires > :now',
          IndexName: 'GSI1',
          KeyConditionExpression: '#partition = :partitionValue AND #sort BETWEEN :start AND :end',
          Limit: Math.max(1, Math.min(1000, MAX_RECORDS - records.length)),
          TableName: tableName,
        }))

        records.push(...(response.Items || []))
        if (records.length > MAX_RECORDS) {
          throw new QueryLimitError()
        }
        exclusiveStartKey = response.LastEvaluatedKey
        if (records.length === MAX_RECORDS && exclusiveStartKey) {
          throw new QueryLimitError()
        }
      } while (exclusiveStartKey)
    }
  }

  return records
}

export { MAX_RECORDS, QueryLimitError, getDateRange, queryEvents }
