import { createHash } from 'node:crypto'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb'
import { validateEventEnvelope } from '../../../src/observability/event-contract.js'
import { readViewerMetadata } from './shared/viewer-metadata.js'

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}))

function response(statusCode, body = {}) {
  return {
    body: JSON.stringify(body),
    headers: {
      'cache-control': 'no-store',
      'content-type': 'application/json',
    },
    statusCode,
  }
}

function getBody(event) {
  if (typeof event.body !== 'string') {
    return undefined
  }
  return event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body
}

function getHeader(headers, headerName) {
  return Object.entries(headers || {})
    .find(([key]) => key.toLowerCase() === headerName.toLowerCase())?.[1]
}

function hasValidBodyHash(headers, rawBody) {
  const expectedHash = getHeader(headers, 'x-amz-content-sha256')
  if (!/^[a-f0-9]{64}$/i.test(expectedHash || '')) {
    return false
  }

  const actualHash = createHash('sha256').update(rawBody, 'utf8').digest('hex')
  return expectedHash.toLowerCase() === actualHash
}

function hashEventId(eventId) {
  let hash = 0
  for (const character of eventId) {
    hash = ((hash << 5) - hash + character.charCodeAt(0)) | 0
  }
  return Math.abs(hash) % 4
}

async function handler(event, context) {
  const method = event.requestContext?.http?.method || event.httpMethod
  const path = event.rawPath || event.requestContext?.http?.path
  if (method !== 'POST' || path !== '/api/observability/events') {
    return response(404, { message: 'Not found.' })
  }

  const contentType = getHeader(event.headers, 'content-type')
  const rawBody = getBody(event)
  if (!contentType?.toLowerCase().startsWith('application/json') || !rawBody) {
    return response(400, { message: 'Invalid event request.' })
  }
  if (Buffer.byteLength(rawBody, 'utf8') > 8 * 1024) {
    return response(413, { message: 'Event is too large.' })
  }
  if (!hasValidBodyHash(event.headers, rawBody)) {
    return response(400, { message: 'Invalid event request.' })
  }

  let parsed
  try {
    parsed = JSON.parse(rawBody)
  } catch {
    return response(400, { message: 'Invalid event request.' })
  }

  const validation = validateEventEnvelope(parsed, { maxBytes: 8 * 1024 })
  if (!validation.ok) {
    return response(400, { message: 'Invalid event request.' })
  }

  const viewer = readViewerMetadata(event.headers)
  if (!viewer.ok) {
    return response(400, { message: 'Trusted viewer metadata is unavailable.' })
  }

  const receivedAt = new Date().toISOString()
  const item = {
    ...validation.value,
    ...viewer.value,
    GSI1PK: `DAY#${receivedAt.slice(0, 10)}#SHARD#${String(hashEventId(validation.value.eventId)).padStart(2, '0')}`,
    GSI1SK: `${receivedAt}#${validation.value.eventId}`,
    eventDate: receivedAt.slice(0, 10),
    expiresAt: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
    receivedAt,
  }

  try {
    await client.send(new PutCommand({
      ConditionExpression: 'attribute_not_exists(eventId)',
      Item: item,
      TableName: process.env.EVENTS_TABLE_NAME,
    }))
    console.log(JSON.stringify({ eventName: item.eventName, requestId: context.awsRequestId, result: 'accepted' }))
  } catch (error) {
    if (error.name === 'ConditionalCheckFailedException') {
      console.log(JSON.stringify({ eventName: item.eventName, requestId: context.awsRequestId, result: 'duplicate' }))
      return response(202, { accepted: true })
    }

    console.error(JSON.stringify({ requestId: context.awsRequestId, result: 'storage-error' }))
    return response(503, { message: 'Analytics is temporarily unavailable.' })
  }

  return response(202, { accepted: true })
}

export { handler }
