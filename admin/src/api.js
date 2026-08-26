import { sha256Hex } from '../../src/observability/body-hash.js'

async function adminRequest(path, { body, method = 'GET' } = {}, token) {
  const requestBody = body ? JSON.stringify(body) : undefined
  const bodyHash = requestBody ? await sha256Hex(requestBody) : undefined
  if (requestBody && !bodyHash) {
    throw new Error('Your browser cannot prepare the protected export request.')
  }

  const response = await fetch(path, {
    body: requestBody,
    credentials: 'omit',
    headers: {
      ...(requestBody ? {
        'content-type': 'application/json',
        'x-amz-content-sha256': bodyHash,
      } : {}),
      'X-Oro-Admin-Token': token,
    },
    method,
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload.message || 'The analytics service is unavailable.')
  }
  return payload
}

function getMetrics(token, from, to) {
  const query = new URLSearchParams({ from, to })
  return adminRequest(`/api/observability/admin/metrics?${query}`, {}, token)
}

function createExport(token, from, to) {
  return adminRequest(
    '/api/observability/admin/export',
    { body: { from, to }, method: 'POST' },
    token,
  )
}

export { createExport, getMetrics }
