import assert from 'node:assert/strict'
import { test } from 'node:test'
import { escapeCsvCell, toCsv } from '../lambda/shared/csv.js'
import { getDateRange, QueryLimitError } from '../lambda/shared/query-events.js'
import { parseViewerAddress, readViewerMetadata } from '../lambda/shared/viewer-metadata.js'

test('normalizes trusted IPv4 and IPv6 viewer addresses', () => {
  assert.equal(parseViewerAddress('203.0.113.10:443'), '203.0.113.10')
  assert.equal(parseViewerAddress('[2001:db8::10]:443'), '2001:db8::10')
  assert.equal(parseViewerAddress('not-an-ip:443'), undefined)
})

test('requires trusted IP and uses XX for unavailable geography', () => {
  const metadata = readViewerMetadata({ 'CloudFront-Viewer-Address': '203.0.113.10:443' })
  assert.equal(metadata.ok, true)
  assert.deepEqual(metadata.value, {
    countryCode: 'XX',
    deviceClass: 'unknown',
    regionCode: 'XX',
    sourceIp: '203.0.113.10',
  })
  assert.equal(readViewerMetadata({}).ok, false)
})

test('keeps state only for US viewers', () => {
  const usViewer = readViewerMetadata({
    'CloudFront-Viewer-Address': '203.0.113.10:443',
    'CloudFront-Viewer-Country': 'US',
    'CloudFront-Viewer-Country-Region': 'CA',
  })
  const nonUsViewer = readViewerMetadata({
    'CloudFront-Viewer-Address': '203.0.113.11:443',
    'CloudFront-Viewer-Country': 'CA',
    'CloudFront-Viewer-Country-Region': 'BC',
  })

  assert.equal(usViewer.value.regionCode, 'CA')
  assert.equal(nonUsViewer.value.regionCode, 'XX')
})

test('bounds query dates to 31 days', () => {
  assert.equal(getDateRange('2026-08-01', '2026-08-31').length, 31)
  assert.throws(() => getDateRange('2026-08-01', '2026-09-01'), QueryLimitError)
  assert.throws(() => getDateRange('2026-08-31', '2026-08-01'))
})

test('escapes CSV formula-like values and structural characters', () => {
  assert.equal(escapeCsvCell('=SUM(A1:A2)'), '"\'=SUM(A1:A2)"')
  assert.equal(escapeCsvCell('a,"b"'), '"a,""b"""')
  const csv = toCsv([{
    countryCode: 'US',
    deviceClass: 'desktop',
    eventName: 'product_selected',
    properties: { productId: 'heloc' },
    receivedAt: '2026-08-23T00:00:00.000Z',
    regionCode: 'CA',
    sessionPseudonym: 'safe',
  }])
  assert.match(csv, /propertiesJson/)
  assert.match(csv, /product_selected/)
})
