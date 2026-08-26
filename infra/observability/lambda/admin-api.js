import { randomBytes, randomUUID, createHmac } from 'node:crypto'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { verifyAdminToken } from './shared/cognito-verifier.js'
import { QueryLimitError, queryEvents } from './shared/query-events.js'
import { toCsv } from './shared/csv.js'

const s3Client = new S3Client({})
const STEP_IDS = ['goal', 'stay', 'payment', 'priority']
const PRODUCT_IDS = [
  'heloc',
  'heloan',
  'cash-out-refinance',
  'reverse-mortgage',
  'home-equity-investment',
  'co-ownership',
  'sale-leaseback',
]

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

function getHeader(headers, name) {
  const expected = name.toLowerCase()
  return Object.entries(headers || {}).find(([key]) => key.toLowerCase() === expected)?.[1]
}

function requestPath(event) {
  return event.rawPath || event.requestContext?.http?.path || ''
}

function parseBody(event) {
  if (!event.body) {
    return {}
  }
  try {
    return JSON.parse(event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body)
  } catch {
    throw new Error('Invalid request body.')
  }
}

function queryRange(event) {
  return {
    from: event.queryStringParameters?.from,
    to: event.queryStringParameters?.to,
  }
}

function calculateMetrics(records) {
  const sessions = new Set()
  const guidedStarts = new Set()
  const guidedCompletions = new Set()
  const resultSessions = new Set()
  const exploredSessions = new Set()
  const stepCompletions = Object.fromEntries(STEP_IDS.map((step) => [step, 0]))
  const sessionMetadata = new Map()
  const productSessions = new Map()

  for (const record of records) {
    const sessionId = record.sessionId
    sessions.add(sessionId)
    if (!sessionMetadata.has(sessionId)) {
      const countryCode = record.countryCode || 'XX'
      sessionMetadata.set(sessionId, {
        countryCode,
        deviceClass: record.deviceClass || 'unknown',
        // Defense in depth: historic or malformed records cannot expose
        // sub-national data outside the US-only reporting policy.
        regionCode: countryCode === 'US' ? record.regionCode || 'XX' : 'XX',
      })
    }
    if (record.eventName === 'guided_flow_started') guidedStarts.add(sessionId)
    if (record.eventName === 'assessment_completed') guidedCompletions.add(sessionId)
    if (record.eventName === 'results_viewed') resultSessions.add(sessionId)
    if (record.eventName === 'product_detail_opened') exploredSessions.add(sessionId)
    if (['product_detail_opened', 'product_selected'].includes(record.eventName)) {
      const productId = record.properties?.productId
      if (PRODUCT_IDS.includes(productId)) {
        if (!productSessions.has(productId)) {
          productSessions.set(productId, { detail: new Set(), selected: new Set() })
        }
        const product = productSessions.get(productId)
        if (record.eventName === 'product_detail_opened') product.detail.add(sessionId)
        if (record.eventName === 'product_selected') product.selected.add(sessionId)
      }
    }
    if (record.eventName === 'assessment_step_completed' && stepCompletions[record.properties?.stepId] !== undefined) {
      stepCompletions[record.properties.stepId] += 1
    }
  }

  const completedGuidedSessions = [...guidedCompletions].filter((sessionId) => guidedStarts.has(sessionId)).length
  const exploredResults = [...exploredSessions].filter((sessionId) => resultSessions.has(sessionId)).length
  const deviceSessions = new Map()
  const locationSessions = new Map()

  for (const [sessionId, metadata] of sessionMetadata) {
    if (!deviceSessions.has(metadata.deviceClass)) {
      deviceSessions.set(metadata.deviceClass, new Set())
    }
    deviceSessions.get(metadata.deviceClass).add(sessionId)

    const locationKey = `${metadata.countryCode}-${metadata.regionCode}`
    if (!locationSessions.has(locationKey)) {
      locationSessions.set(locationKey, {
        countryCode: metadata.countryCode,
        regionCode: metadata.regionCode,
        sessions: new Set(),
      })
    }
    locationSessions.get(locationKey).sessions.add(sessionId)
  }

  const deviceBreakdown = [...deviceSessions.entries()]
    .map(([deviceClass, deviceSessionIds]) => ({
      deviceClass,
      sessionCount: deviceSessionIds.size,
    }))
    .sort((left, right) => right.sessionCount - left.sessionCount || left.deviceClass.localeCompare(right.deviceClass))

  const locationBreakdown = [...locationSessions.values()]
    .map(({ countryCode, regionCode, sessions: locationSessionIds }) => ({
      countryCode,
      regionCode,
      sessionCount: locationSessionIds.size,
    }))
    .sort((left, right) => (
      right.sessionCount - left.sessionCount
      || `${left.countryCode}-${left.regionCode}`.localeCompare(`${right.countryCode}-${right.regionCode}`)
    ))
    .slice(0, 5)

  const productUsage = [...productSessions.entries()]
    .map(([productId, product]) => ({
      detailSessions: product.detail.size,
      productId,
      selectedSessions: product.selected.size,
    }))
    .sort((left, right) => (
      right.selectedSessions - left.selectedSessions
      || right.detailSessions - left.detailSessions
      || left.productId.localeCompare(right.productId)
    ))
    .slice(0, 5)

  return {
    deviceBreakdown,
    guidedCompletionRate: guidedStarts.size ? completedGuidedSessions / guidedStarts.size : null,
    locationBreakdown,
    productUsage,
    productExplorationRate: resultSessions.size ? exploredResults / resultSessions.size : null,
    stepCompletions,
    uniqueSessions: sessions.size,
  }
}

function createSessionPseudonym(sessionId, key) {
  return createHmac('sha256', key).update(sessionId).digest('hex').slice(0, 24)
}

async function createCsvExport(records) {
  const key = randomBytes(32)
  const csv = toCsv(records.map((record) => {
    const countryCode = record.countryCode || 'XX'
    return {
      countryCode,
      deviceClass: record.deviceClass,
      eventName: record.eventName,
      properties: record.properties,
      receivedAt: record.receivedAt,
      regionCode: countryCode === 'US' ? record.regionCode || 'XX' : 'XX',
      sessionPseudonym: createSessionPseudonym(record.sessionId, key),
    }
  }))
  const objectKey = `exports/${randomUUID()}.csv`
  await s3Client.send(new PutObjectCommand({
    Bucket: process.env.EXPORT_BUCKET_NAME,
    Body: Buffer.from(csv, 'utf8'),
    CacheControl: 'no-store',
    ContentDisposition: 'attachment; filename="oro-observability.csv"',
    ContentType: 'text/csv; charset=utf-8',
    Key: objectKey,
    ServerSideEncryption: 'AES256',
  }))

  const downloadUrl = await getSignedUrl(
    s3Client,
    new GetObjectCommand({ Bucket: process.env.EXPORT_BUCKET_NAME, Key: objectKey }),
    { expiresIn: 300 },
  )
  return { downloadUrl, expiresAt: new Date(Date.now() + 300000).toISOString() }
}

async function handler(event) {
  try {
    await verifyAdminToken(getHeader(event.headers, 'X-Oro-Admin-Token'))
  } catch {
    return response(401, { message: 'Authentication required.' })
  }

  try {
    const path = requestPath(event)
    const method = event.requestContext?.http?.method || event.httpMethod
    if (method === 'GET' && path === '/api/observability/admin/metrics') {
      const range = queryRange(event)
      const records = await queryEvents(range)
      const metrics = calculateMetrics(records)
      const body = JSON.stringify({ metrics, range })
      if (Buffer.byteLength(body, 'utf8') > 256 * 1024) {
        return response(413, { message: 'The metrics response is too large.' })
      }
      return { ...response(200), body }
    }

    if (method === 'POST' && path === '/api/observability/admin/export') {
      const body = parseBody(event)
      if (!body || typeof body !== 'object' || Array.isArray(body)
        || Object.keys(body).some((key) => !['from', 'to'].includes(key))) {
        return response(400, { message: 'Invalid export request.' })
      }
      const records = await queryEvents({ from: body.from, to: body.to })
      return response(201, await createCsvExport(records))
    }
  } catch (error) {
    if (error instanceof QueryLimitError) {
      return response(413, { message: error.message })
    }
    if (error.message?.includes('Date') || error.message?.includes('date')) {
      return response(400, { message: error.message })
    }
    console.error(JSON.stringify({ requestId: event.requestContext?.requestId, result: 'admin-error' }))
    return response(503, { message: 'Analytics is temporarily unavailable.' })
  }

  return response(404, { message: 'Not found.' })
}

export { calculateMetrics, handler }
