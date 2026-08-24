import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { test } from 'node:test'
import { createExport } from './api.js'

test('hashes the exact protected CSV export body', async () => {
  const originalFetch = globalThis.fetch
  const requests = []
  globalThis.fetch = async (path, request) => {
    requests.push({ path, request })
    return new Response(JSON.stringify({ downloadUrl: 'https://example.com/export.csv' }), {
      headers: { 'content-type': 'application/json' },
      status: 201,
    })
  }

  try {
    await createExport('admin-token', '2026-08-01', '2026-08-02')
    assert.equal(requests.length, 1)
    assert.equal(requests[0].request.body, '{"from":"2026-08-01","to":"2026-08-02"}')
    assert.equal(
      requests[0].request.headers['x-amz-content-sha256'],
      createHash('sha256').update(requests[0].request.body).digest('hex'),
    )
  } finally {
    globalThis.fetch = originalFetch
  }
})
