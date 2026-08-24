async function sha256Hex(body, cryptoImpl = globalThis.crypto) {
  if (typeof cryptoImpl?.subtle?.digest !== 'function') {
    return undefined
  }

  const digest = await cryptoImpl.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(body),
  )

  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export { sha256Hex }
