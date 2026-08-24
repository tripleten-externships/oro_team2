function escapeCsvCell(value) {
  let text = value === null || value === undefined ? '' : String(value)
  if (/^[=+\-@]/.test(text)) {
    text = `'${text}`
  }
  return `"${text.replaceAll('"', '""')}"`
}

function toCsv(rows) {
  const headers = [
    'receivedAt',
    'eventName',
    'countryCode',
    'regionCode',
    'deviceClass',
    'sessionPseudonym',
    'propertiesJson',
  ]
  const lines = [headers.map(escapeCsvCell).join(',')]

  for (const row of rows) {
    lines.push([
      row.receivedAt,
      row.eventName,
      row.countryCode,
      row.regionCode,
      row.deviceClass,
      row.sessionPseudonym,
      JSON.stringify(row.properties),
    ].map(escapeCsvCell).join(','))
  }

  return `${lines.join('\r\n')}\r\n`
}

export { escapeCsvCell, toCsv }
