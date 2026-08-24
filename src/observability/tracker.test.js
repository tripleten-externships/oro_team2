import assert from 'node:assert/strict'
import { test } from 'node:test'
import { webcrypto } from 'node:crypto'
import { createObservabilityTracker } from './tracker.js'

function createStorage() {
  const values = new Map()
  return {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
  }
}

function createCrypto(ids = ['11111111-1111-4111-8111-111111111111']) {
  let index = 0
  return {
    randomUUID: () => ids[Math.min(index++, ids.length - 1)],
    subtle: webcrypto.subtle,
  }
}

test('disabled tracking performs no network calls', async () => {
  let calls = 0
  const tracker = createObservabilityTracker({
    cryptoImpl: createCrypto(),
    enabled: false,
    fetchImpl: async () => {
      calls += 1
      return { ok: true, status: 202 }
    },
    storage: createStorage(),
  })

  await tracker.track('guided_flow_started')
  assert.equal(calls, 0)
})

test('invalid and sensitive event properties are dropped', async () => {
  let calls = 0
  const tracker = createObservabilityTracker({
    cryptoImpl: createCrypto(),
    enabled: true,
    fetchImpl: async () => {
      calls += 1
      return { ok: true, status: 202 }
    },
    storage: createStorage(),
  })

  await tracker.track('home_details_submitted', { homeValue: '$100000' })
  await tracker.track('product_selected', { productId: 'unknown-product' })
  assert.equal(calls, 0)
})

test('retries keep the same event ID and body hash', async () => {
  const requests = []
  let attempts = 0
  const tracker = createObservabilityTracker({
    cryptoImpl: createCrypto([
      '11111111-1111-4111-8111-111111111111',
      '22222222-2222-4222-8222-222222222222',
    ]),
    enabled: true,
    fetchImpl: async (url, request) => {
      requests.push({ url, request })
      attempts += 1
      return { ok: attempts > 1, status: attempts === 1 ? 503 : 202 }
    },
    storage: createStorage(),
  })

  await tracker.track('product_selected', { productId: 'heloc' })
  assert.equal(requests.length, 2)
  assert.equal(JSON.parse(requests[0].request.body).eventId, JSON.parse(requests[1].request.body).eventId)
  assert.equal(requests[0].request.headers['x-amz-content-sha256'], requests[1].request.headers['x-amz-content-sha256'])
  assert.equal(requests[0].request.credentials, 'omit')
})

test('session IDs are stable and trackOnce de-duplicates events', async () => {
  const events = []
  const tracker = createObservabilityTracker({
    cryptoImpl: createCrypto([
      '11111111-1111-4111-8111-111111111111',
      '22222222-2222-4222-8222-222222222222',
      '33333333-3333-4333-8333-333333333333',
    ]),
    enabled: true,
    fetchImpl: async (url, request) => {
      events.push(JSON.parse(request.body))
      return { ok: true, status: 202 }
    },
    storage: createStorage(),
  })

  await tracker.track('guided_flow_started')
  await tracker.trackOnce('results', 'results_viewed', { journeyType: 'guided' })
  await tracker.trackOnce('results', 'results_viewed', { journeyType: 'guided' })

  assert.equal(events.length, 2)
  assert.equal(events[0].sessionId, events[1].sessionId)
})
