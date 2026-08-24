import { isIP } from 'node:net'

function getHeader(headers, name) {
  const expected = name.toLowerCase()
  const entry = Object.entries(headers || {}).find(([key]) => key.toLowerCase() === expected)
  return entry?.[1]
}

function parseViewerAddress(value) {
  if (typeof value !== 'string') {
    return undefined
  }

  const trimmed = value.trim()
  let candidate = trimmed
  if (trimmed.startsWith('[')) {
    const closingBracket = trimmed.indexOf(']')
    if (closingBracket < 0) {
      return undefined
    }
    candidate = trimmed.slice(1, closingBracket)
  } else if (trimmed.split(':').length === 2 && /^\d+$/.test(trimmed.slice(trimmed.lastIndexOf(':') + 1))) {
    candidate = trimmed.slice(0, trimmed.lastIndexOf(':'))
  }

  return isIP(candidate) ? candidate : undefined
}

function normalizeCountry(value) {
  if (typeof value !== 'string') {
    return 'XX'
  }

  const normalized = value.trim().toUpperCase()
  return /^[A-Z]{2}$/.test(normalized) ? normalized : 'XX'
}

function normalizeRegion(value) {
  if (typeof value !== 'string') {
    return 'XX'
  }

  const normalized = value.trim().toUpperCase()
  return /^[A-Z0-9-]{2,16}$/.test(normalized) ? normalized : 'XX'
}

function getDeviceClass(headers) {
  const flags = [
    ['CloudFront-Is-Mobile-Viewer', 'mobile'],
    ['CloudFront-Is-Tablet-Viewer', 'tablet'],
    ['CloudFront-Is-Desktop-Viewer', 'desktop'],
    ['CloudFront-Is-SmartTV-Viewer', 'smart-tv'],
  ]

  return flags.find(([header]) => getHeader(headers, header)?.toLowerCase() === 'true')?.[1] || 'unknown'
}

function readViewerMetadata(headers) {
  const sourceIp = parseViewerAddress(getHeader(headers, 'CloudFront-Viewer-Address'))
  if (!sourceIp) {
    return { ok: false, error: 'trusted viewer address is missing or malformed' }
  }

  const countryCode = normalizeCountry(getHeader(headers, 'CloudFront-Viewer-Country'))

  return {
    ok: true,
    value: {
      countryCode,
      deviceClass: getDeviceClass(headers),
      // Keep sub-national location only for the US product audience.
      regionCode: countryCode === 'US'
        ? normalizeRegion(getHeader(headers, 'CloudFront-Viewer-Country-Region'))
        : 'XX',
      sourceIp,
    },
  }
}

export { parseViewerAddress, readViewerMetadata }
