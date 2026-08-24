import assert from 'node:assert/strict'
import { test } from 'node:test'
import { exportJWK, generateKeyPair, SignJWT } from 'jose'
import { calculateMetrics } from '../lambda/admin-api.js'
import { verifyAdminToken } from '../lambda/shared/cognito-verifier.js'

test('aggregates bounded metrics by anonymous session', () => {
  const metrics = calculateMetrics([
    { countryCode: 'US', deviceClass: 'desktop', eventName: 'guided_flow_started', properties: {}, regionCode: 'CA', sessionId: 'session-1' },
    { countryCode: 'US', deviceClass: 'desktop', eventName: 'assessment_step_completed', properties: { stepId: 'priority' }, regionCode: 'CA', sessionId: 'session-1' },
    { countryCode: 'US', deviceClass: 'desktop', eventName: 'assessment_completed', properties: {}, regionCode: 'CA', sessionId: 'session-1' },
    { countryCode: 'US', deviceClass: 'desktop', eventName: 'results_viewed', properties: {}, regionCode: 'CA', sessionId: 'session-1' },
    { countryCode: 'US', deviceClass: 'desktop', eventName: 'product_detail_opened', properties: { productId: 'heloc' }, regionCode: 'CA', sessionId: 'session-1' },
    { countryCode: 'US', deviceClass: 'mobile', eventName: 'guided_flow_started', properties: {}, regionCode: 'NY', sessionId: 'session-2' },
    { countryCode: 'US', deviceClass: 'mobile', eventName: 'results_viewed', properties: {}, regionCode: 'NY', sessionId: 'session-2' },
    { countryCode: 'US', deviceClass: 'mobile', eventName: 'product_selected', properties: { productId: 'heloc' }, regionCode: 'NY', sessionId: 'session-2' },
    { countryCode: 'CA', deviceClass: 'tablet', eventName: 'results_viewed', properties: {}, regionCode: 'BC', sessionId: 'session-3' },
  ])

  assert.equal(metrics.uniqueSessions, 3)
  assert.equal(metrics.guidedCompletionRate, 0.5)
  assert.equal(metrics.productExplorationRate, 1 / 3)
  assert.equal(metrics.stepCompletions.priority, 1)
  assert.deepEqual(metrics.productUsage, [
    { detailSessions: 1, productId: 'heloc', selectedSessions: 1 },
  ])
  assert.deepEqual(metrics.deviceBreakdown, [
    { deviceClass: 'desktop', sessionCount: 1 },
    { deviceClass: 'mobile', sessionCount: 1 },
    { deviceClass: 'tablet', sessionCount: 1 },
  ])
  assert.deepEqual(metrics.locationBreakdown, [
    { countryCode: 'CA', regionCode: 'XX', sessionCount: 1 },
    { countryCode: 'US', regionCode: 'CA', sessionCount: 1 },
    { countryCode: 'US', regionCode: 'NY', sessionCount: 1 },
  ])
})

test('accepts only a valid Cognito-style admin access token', async () => {
  const { privateKey, publicKey } = await generateKeyPair('RS256')
  const jwk = await exportJWK(publicKey)
  jwk.kid = 'test-key'
  const issuer = 'https://test-issuer.example'
  const previousIssuer = process.env.COGNITO_ISSUER
  const previousClientId = process.env.COGNITO_CLIENT_ID
  const previousFetch = globalThis.fetch
  process.env.COGNITO_ISSUER = issuer
  process.env.COGNITO_CLIENT_ID = 'client-id'
  globalThis.fetch = async () => new Response(JSON.stringify({ keys: [jwk] }), {
    headers: { 'content-type': 'application/json' },
    status: 200,
  })

  try {
    const token = await new SignJWT({
      'cognito:groups': ['oro-admin'],
      client_id: 'client-id',
      token_use: 'access',
    })
      .setProtectedHeader({ alg: 'RS256', kid: 'test-key' })
      .setIssuer(issuer)
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(privateKey)

    await assert.doesNotReject(() => verifyAdminToken(token))

    const wrongGroup = await new SignJWT({
      'cognito:groups': ['viewer'],
      client_id: 'client-id',
      token_use: 'access',
    })
      .setProtectedHeader({ alg: 'RS256', kid: 'test-key' })
      .setIssuer(issuer)
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(privateKey)
    await assert.rejects(() => verifyAdminToken(wrongGroup))
  } finally {
    globalThis.fetch = previousFetch
    if (previousIssuer === undefined) delete process.env.COGNITO_ISSUER
    else process.env.COGNITO_ISSUER = previousIssuer
    if (previousClientId === undefined) delete process.env.COGNITO_CLIENT_ID
    else process.env.COGNITO_CLIENT_ID = previousClientId
  }
})
