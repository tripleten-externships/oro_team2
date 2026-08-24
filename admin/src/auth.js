const PKCE_STORAGE_KEY = 'oro-admin-pkce'
let accessToken

function getConfig() {
  return {
    clientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
    domain: import.meta.env.VITE_COGNITO_DOMAIN?.replace(/\/$/, ''),
    redirectUri: import.meta.env.VITE_COGNITO_REDIRECT_URI || `${globalThis.location.origin}/oro-admin/`,
  }
}

function toBase64Url(bytes) {
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return globalThis.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function createVerifier() {
  const bytes = new Uint8Array(48)
  globalThis.crypto.getRandomValues(bytes)
  return toBase64Url(bytes)
}

async function createChallenge(verifier) {
  const digest = await globalThis.crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(verifier),
  )
  return toBase64Url(new Uint8Array(digest))
}

function readPkceState() {
  try {
    return JSON.parse(globalThis.sessionStorage.getItem(PKCE_STORAGE_KEY) || 'null')
  } catch {
    return null
  }
}

function clearPkceState() {
  try {
    globalThis.sessionStorage.removeItem(PKCE_STORAGE_KEY)
  } catch {
    return
  }
}

async function startSignIn() {
  const config = getConfig()
  if (!config.clientId || !config.domain) {
    throw new Error('Cognito configuration is missing.')
  }

  const verifier = createVerifier()
  const state = globalThis.crypto.randomUUID()
  const challenge = await createChallenge(verifier)
  globalThis.sessionStorage.setItem(PKCE_STORAGE_KEY, JSON.stringify({ state, verifier }))

  const params = new URLSearchParams({
    client_id: config.clientId,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: 'openid',
    state,
  })
  globalThis.location.assign(`${config.domain}/oauth2/authorize?${params}`)
}

async function completeSignIn() {
  const query = new URLSearchParams(globalThis.location.search)
  const code = query.get('code')
  if (!code) {
    return undefined
  }

  const stored = readPkceState()
  const config = getConfig()
  if (!stored?.state || stored.state !== query.get('state') || !stored.verifier) {
    clearPkceState()
    throw new Error('The sign-in response could not be verified.')
  }

  const response = await fetch(`${config.domain}/oauth2/token`, {
    body: new URLSearchParams({
      client_id: config.clientId,
      code,
      code_verifier: stored.verifier,
      grant_type: 'authorization_code',
      redirect_uri: config.redirectUri,
    }),
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    method: 'POST',
  })
  if (!response.ok) {
    clearPkceState()
    throw new Error('The sign-in token could not be exchanged.')
  }

  const tokenResponse = await response.json()
  if (typeof tokenResponse.access_token !== 'string' || !tokenResponse.access_token) {
    clearPkceState()
    throw new Error('The sign-in response did not include an access token.')
  }

  clearPkceState()
  accessToken = tokenResponse.access_token
  globalThis.history.replaceState({}, '', `${globalThis.location.pathname}`)
  return accessToken
}

function getAccessToken() {
  return accessToken
}

function clearAccessToken() {
  accessToken = undefined
}

function startSignOut() {
  const config = getConfig()
  accessToken = undefined
  if (!config.clientId || !config.domain) {
    return
  }

  const params = new URLSearchParams({
    client_id: config.clientId,
    logout_uri: config.redirectUri,
  })
  globalThis.location.assign(`${config.domain}/logout?${params}`)
}

export {
  clearAccessToken,
  completeSignIn,
  getAccessToken,
  startSignIn,
  startSignOut,
}
