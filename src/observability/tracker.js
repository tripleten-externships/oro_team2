import { validateEventEnvelope } from './event-contract.js'
import { sha256Hex } from './body-hash.js'

const SESSION_ID_KEY = 'oro-observability-session-id'
const ONCE_KEY_PREFIX = 'oro-observability-once:'

function getSafeStorage(storage) {
  if (storage) {
    return storage
  }

  try {
    return globalThis.sessionStorage
  } catch {
    return undefined
  }
}

function createId(cryptoImpl) {
  if (typeof cryptoImpl?.randomUUID !== 'function') {
    return undefined
  }

  try {
    return cryptoImpl.randomUUID()
  } catch {
    return undefined
  }
}

function getSessionId(storage, cryptoImpl) {
  try {
    const existing = storage?.getItem(SESSION_ID_KEY)
    if (existing) {
      return existing
    }
  } catch {
    // Privacy settings can make sessionStorage unavailable.
  }

  const created = createId(cryptoImpl)
  if (!created) {
    return undefined
  }

  try {
    storage?.setItem(SESSION_ID_KEY, created)
  } catch {
    // An in-memory session remains valid when storage is blocked.
  }

  return created
}

function shouldRetry(status) {
  return status === 408 || status === 429 || status >= 500
}

function createObservabilityTracker({
  enabled = false,
  endpoint = '/api/observability/events',
  fetchImpl = globalThis.fetch,
  storage,
  cryptoImpl = globalThis.crypto,
  now = () => new Date(),
} = {}) {
  const safeStorage = getSafeStorage(storage)
  const onceKeys = new Set()
  let memorySessionId

  function sessionId() {
    if (!memorySessionId) {
      memorySessionId = getSessionId(safeStorage, cryptoImpl)
    }
    return memorySessionId
  }

  async function send(event) {
    if (typeof fetchImpl !== 'function') {
      return
    }

    const body = JSON.stringify(event)
    const bodyHash = await sha256Hex(body, cryptoImpl)
    if (!bodyHash) {
      return
    }

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const response = await fetchImpl(endpoint, {
          body,
          credentials: 'omit',
          headers: {
            'content-type': 'application/json',
            // Required for viewer POST requests to an OAC-protected Lambda URL.
            'x-amz-content-sha256': bodyHash,
          },
          keepalive: true,
          method: 'POST',
          referrerPolicy: 'no-referrer',
        })

        if (response?.ok || response?.status === 202) {
          return
        }

        if (!shouldRetry(response?.status || 0)) {
          return
        }
      } catch {
        if (attempt === 2) {
          return
        }
      }
    }
  }

  function track(eventName, properties = {}) {
    try {
      if (!enabled || !sessionId()) {
        return Promise.resolve()
      }

      const envelope = {
        clientOccurredAt: now().toISOString(),
        eventId: createId(cryptoImpl),
        eventName,
        properties,
        schemaVersion: 1,
        sessionId: sessionId(),
      }
      const validation = validateEventEnvelope(envelope)
      if (!validation.ok) {
        return Promise.resolve()
      }

      return send(validation.value).catch(() => undefined)
    } catch {
      return Promise.resolve()
    }
  }

  function trackOnce(key, eventName, properties = {}) {
    if (!enabled || onceKeys.has(key)) {
      return Promise.resolve()
    }

    const storageKey = `${ONCE_KEY_PREFIX}${key}`
    try {
      if (safeStorage?.getItem(storageKey)) {
        onceKeys.add(key)
        return Promise.resolve()
      }
      safeStorage?.setItem(storageKey, '1')
    } catch {
      // In-memory de-duplication is still useful when storage is blocked.
    }

    onceKeys.add(key)
    return track(eventName, properties)
  }

  return Object.freeze({ track, trackOnce })
}

const observabilityTracker = createObservabilityTracker({
  enabled: import.meta.env?.VITE_OBSERVABILITY_ENABLED === 'true',
})

export {
  createObservabilityTracker,
  observabilityTracker,
}
