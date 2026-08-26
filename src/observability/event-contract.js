const PRODUCT_IDS = Object.freeze([
  'heloc',
  'heloan',
  'cash-out-refinance',
  'reverse-mortgage',
  'home-equity-investment',
  'co-ownership',
  'sale-leaseback',
])

const EVENT_SCHEMAS = Object.freeze({
  session_started: { entryPath: ['guided', 'direct'] },
  guided_flow_started: {},
  direct_flow_started: {},
  assessment_step_completed: { stepId: ['goal', 'stay', 'payment', 'priority'] },
  assessment_completed: {},
  home_details_submitted: {},
  results_viewed: { journeyType: ['guided', 'direct'] },
  product_detail_opened: { productId: PRODUCT_IDS },
  product_selected: { productId: PRODUCT_IDS },
  comparison_viewed: { productCountBucket: ['1', '2', '3'] },
  flow_restarted: { fromStage: ['questionnaire', 'home-details', 'results'] },
})

const EVENT_NAMES = Object.freeze(Object.keys(EVENT_SCHEMAS))
const TOP_LEVEL_KEYS = new Set([
  'schemaVersion',
  'eventId',
  'sessionId',
  'eventName',
  'clientOccurredAt',
  'properties',
])
const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const MAX_EVENT_BYTES = 8 * 1024
const MAX_STRING_LENGTH = 64
const MAX_CLIENT_TIME_SKEW_MS = 24 * 60 * 60 * 1000
const MAX_CLIENT_FUTURE_SKEW_MS = 5 * 60 * 1000

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isUuidV4(value) {
  return typeof value === 'string' && UUID_V4_PATTERN.test(value)
}

function isSensitiveKey(key) {
  return /home|mortgage|balance|rate|cash|income|age|answer|input|credit|email|phone|name|address|token|authorization|cookie|storage|user.?agent/i.test(key)
}

function validateProperties(eventName, properties) {
  if (!isRecord(properties)) {
    return { ok: false, error: 'properties must be an object' }
  }

  const schema = EVENT_SCHEMAS[eventName]
  const keys = Object.keys(properties)
  if (keys.length !== Object.keys(schema).length) {
    return { ok: false, error: 'properties do not match the event schema' }
  }

  for (const key of keys) {
    if (isSensitiveKey(key) || !Object.prototype.hasOwnProperty.call(schema, key)) {
      return { ok: false, error: 'unknown or sensitive property' }
    }

    const value = properties[key]
    if (typeof value !== 'string' || value.length === 0 || value.length > MAX_STRING_LENGTH) {
      return { ok: false, error: 'property values must be bounded strings' }
    }

    if (!schema[key].includes(value)) {
      return { ok: false, error: 'property value is not allowed' }
    }
  }

  return { ok: true, value: Object.fromEntries(keys.map((key) => [key, properties[key]])) }
}

function validateClientOccurredAt(value, now = Date.now()) {
  if (typeof value !== 'string') {
    return false
  }

  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) {
    return false
  }

  return parsed >= now - MAX_CLIENT_TIME_SKEW_MS && parsed <= now + MAX_CLIENT_FUTURE_SKEW_MS
}

function validateEventEnvelope(envelope, options = {}) {
  const { now = Date.now(), maxBytes = MAX_EVENT_BYTES } = options

  if (!isRecord(envelope)) {
    return { ok: false, error: 'event must be an object' }
  }

  const topLevelKeys = Object.keys(envelope)
  if (topLevelKeys.some((key) => !TOP_LEVEL_KEYS.has(key))) {
    return { ok: false, error: 'unknown top-level field' }
  }

  if (envelope.schemaVersion !== 1 || !isUuidV4(envelope.eventId) || !isUuidV4(envelope.sessionId)) {
    return { ok: false, error: 'invalid event identity' }
  }

  if (!EVENT_SCHEMAS[envelope.eventName] || !validateClientOccurredAt(envelope.clientOccurredAt, now)) {
    return { ok: false, error: 'invalid event metadata' }
  }

  const propertiesResult = validateProperties(envelope.eventName, envelope.properties)
  if (!propertiesResult.ok) {
    return propertiesResult
  }

  const normalized = {
    schemaVersion: 1,
    eventId: envelope.eventId,
    sessionId: envelope.sessionId,
    eventName: envelope.eventName,
    clientOccurredAt: envelope.clientOccurredAt,
    properties: propertiesResult.value,
  }

  if (new TextEncoder().encode(JSON.stringify(normalized)).byteLength > maxBytes) {
    return { ok: false, error: 'event is too large' }
  }

  return { ok: true, value: normalized }
}

export {
  EVENT_NAMES,
  EVENT_SCHEMAS,
  MAX_EVENT_BYTES,
  PRODUCT_IDS,
  isUuidV4,
  validateEventEnvelope,
  validateProperties,
}
