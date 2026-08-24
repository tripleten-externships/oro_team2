import { createRemoteJWKSet, jwtVerify } from 'jose'

let remoteJwks
let remoteJwksIssuer

function getJwks(issuer) {
  if (!remoteJwks || remoteJwksIssuer !== issuer) {
    remoteJwks = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`))
    remoteJwksIssuer = issuer
  }
  return remoteJwks
}

async function verifyAdminToken(token) {
  if (typeof token !== 'string' || !token) {
    throw new Error('Missing admin token.')
  }

  const issuer = process.env.COGNITO_ISSUER
  const clientId = process.env.COGNITO_CLIENT_ID
  const { payload } = await jwtVerify(token, getJwks(issuer), {
    algorithms: ['RS256'],
    issuer,
  })

  if (payload.token_use !== 'access' || payload.client_id !== clientId) {
    throw new Error('Token is not an admin access token.')
  }

  const groups = Array.isArray(payload['cognito:groups']) ? payload['cognito:groups'] : []
  if (!groups.includes('oro-admin')) {
    throw new Error('Token is not in the admin group.')
  }

  return payload
}

export { verifyAdminToken }
