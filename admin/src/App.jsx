import { useEffect, useState } from 'react'
import {
  completeSignIn,
  getAccessToken,
  startSignIn,
  startSignOut,
} from './auth.js'
import { createExport, getMetrics } from './api.js'
import { OroButton } from '../../src/components/oro-button'
import { OroCallout } from '../../src/components/oro-callout'
import { OroStatTile } from '../../src/components/oro-stat-tile'
import { OroWordmark } from '../../src/components/oro-wordmark'

function toDateInput(date) {
  return date.toISOString().slice(0, 10)
}

function getInitialRange() {
  const to = new Date()
  const from = new Date(to)
  from.setUTCDate(from.getUTCDate() - 6)
  return { from: toDateInput(from), to: toDateInput(to) }
}

function formatPercent(value) {
  return Number.isFinite(value) ? `${Math.round(value * 100)}%` : '—'
}

function formatDeviceClass(value) {
  if (!value) {
    return '—'
  }

  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function formatProductId(value) {
  if (!value) {
    return '—'
  }

  const labels = { heloc: 'HELOC', heloan: 'HELOAN' }
  if (labels[value]) {
    return labels[value]
  }

  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function formatLocation(location) {
  if (!location || location.countryCode === 'XX') {
    return 'Unknown location'
  }

  return location.regionCode === 'XX'
    ? location.countryCode
    : `${location.countryCode} · ${location.regionCode}`
}

function formatShare(value, total) {
  return total > 0 ? `${Math.round((value / total) * 100)}%` : '—'
}

function getBarWidth(value, total) {
  return total > 0 ? `${(value / total) * 100}%` : '0%'
}

function MetricCard({ label, value }) {
  return <OroStatTile className="admin-stat-tile" label={label} value={value} />
}

function Dashboard({ token }) {
  const [initialRange] = useState(getInitialRange)
  const [range, setRange] = useState(initialRange)
  const [metrics, setMetrics] = useState(null)
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('')
  const [exporting, setExporting] = useState(false)

  async function loadMetrics() {
    setStatus('loading')
    setMessage('')
    try {
      setMetrics(await getMetrics(token, range.from, range.to))
      setStatus('ready')
    } catch (error) {
      setStatus('error')
      setMessage(error.message)
    }
  }

  useEffect(() => {
    let active = true
    getMetrics(token, initialRange.from, initialRange.to)
      .then((nextMetrics) => {
        if (active) {
          setMetrics(nextMetrics)
          setStatus('ready')
        }
      })
      .catch((error) => {
        if (active) {
          setStatus('error')
          setMessage(error.message)
        }
      })

    return () => {
      active = false
    }
  }, [initialRange.from, initialRange.to, token])

  async function handleExport() {
    setExporting(true)
    setMessage('')
    try {
      const result = await createExport(token, range.from, range.to)
      if (!result.downloadUrl) {
        throw new Error('The export did not return a download link.')
      }
      const link = document.createElement('a')
      link.href = result.downloadUrl
      link.download = 'oro-observability.csv'
      link.click()
    } catch (error) {
      setMessage(error.message)
    } finally {
      setExporting(false)
    }
  }

  const summary = metrics?.metrics || {}
  const deviceBreakdown = summary.deviceBreakdown || []
  const locationBreakdown = summary.locationBreakdown || []
  const productUsage = summary.productUsage || []
  const mostUsedProduct = productUsage[0]
  const uniqueSessions = summary.uniqueSessions || 0

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div className="admin-header__identity">
          <OroWordmark className="admin-header__wordmark" />
          <div>
            <p className="admin-eyebrow">ORO OBSERVABILITY</p>
            <h1>Journey insights</h1>
            <p>Anonymous product interaction metrics. Counts are approximate.</p>
          </div>
        </div>
        <OroButton className="admin-button" onClick={startSignOut} variant="secondary">
          Sign out
        </OroButton>
      </header>

      <section className="admin-panel" aria-labelledby="range-title">
        <div className="admin-panel__heading">
          <div>
            <h2 id="range-title">Date range</h2>
            <p>Use UTC dates. The API limits ranges to 31 days.</p>
          </div>
          <OroButton className="admin-button" disabled={status === 'loading'} onClick={loadMetrics} variant="secondary">
            Refresh
          </OroButton>
        </div>
        <div className="admin-range">
          <label>
            From
            <input max={range.to} onChange={(event) => setRange((current) => ({ ...current, from: event.target.value }))} type="date" value={range.from} />
          </label>
          <label>
            To
            <input min={range.from} onChange={(event) => setRange((current) => ({ ...current, to: event.target.value }))} type="date" value={range.to} />
          </label>
          <OroButton className="admin-button" onClick={loadMetrics}>
            Apply range
          </OroButton>
          <OroButton
            className="admin-button"
            disabled={status !== 'ready'}
            loading={exporting}
            onClick={handleExport}
            variant="secondary"
          >
            {exporting ? 'Preparing CSV…' : 'Download CSV'}
          </OroButton>
        </div>
      </section>

      {status === 'loading' && <p aria-live="polite" className="admin-status">Loading metrics…</p>}
      {status === 'error' && (
        <OroCallout className="admin-status" role="alert" title="Analytics unavailable" type="error">
          {message}
        </OroCallout>
      )}
      {message && status !== 'error' && (
        <OroCallout className="admin-status" title="Action could not be completed" type="warning">
          {message}
        </OroCallout>
      )}

      {metrics && (
        <>
          <section className="admin-metrics" aria-label="Key metrics">
            <MetricCard label="Unique sessions" value={summary.uniqueSessions ?? '—'} />
            <MetricCard label="Guided completion" value={formatPercent(summary.guidedCompletionRate)} />
            <MetricCard label="Product exploration" value={formatPercent(summary.productExplorationRate)} />
            <MetricCard
              label={mostUsedProduct?.selectedSessions ? 'Most selected product' : 'Most explored product'}
              value={formatProductId(mostUsedProduct?.productId)}
            />
          </section>
          <section className="admin-audience-grid" aria-label="Audience breakdowns">
            <section className="admin-panel" aria-labelledby="device-title">
              <h2 id="device-title">Sessions by device</h2>
              {deviceBreakdown.length > 0 ? (
                <ul aria-label="Sessions by device" className="admin-bar-chart">
                  {deviceBreakdown.map(({ deviceClass, sessionCount }) => (
                    <li key={deviceClass}>
                      <div className="admin-bar-chart__meta">
                        <span>{formatDeviceClass(deviceClass)}</span>
                        <strong>{sessionCount} · {formatShare(sessionCount, uniqueSessions)}</strong>
                      </div>
                      <div aria-hidden="true" className="admin-bar-chart__track">
                        <span
                          className="admin-bar-chart__bar"
                          style={{ width: getBarWidth(sessionCount, uniqueSessions) }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : <p className="admin-empty">No device data yet.</p>}
            </section>
            <section className="admin-panel" aria-labelledby="location-title">
              <h2 id="location-title">Top locations</h2>
              <div className="admin-breakdown-list">
                {locationBreakdown.length > 0 ? locationBreakdown.map((location) => (
                  <div className="admin-breakdown-row" key={`${location.countryCode}-${location.regionCode}`}>
                    <span>{formatLocation(location)}</span>
                    <strong>{location.sessionCount}</strong>
                    <small>{formatShare(location.sessionCount, uniqueSessions)}</small>
                  </div>
                )) : <p className="admin-empty">No location data yet.</p>}
              </div>
            </section>
          </section>
        </>
      )}
    </main>
  )
}

function App() {
  const [token, setToken] = useState(() => getAccessToken())
  const [status, setStatus] = useState('checking')
  const [message, setMessage] = useState('')

  useEffect(() => {
    completeSignIn()
      .then((nextToken) => {
        setToken(nextToken || getAccessToken())
        setStatus('ready')
      })
      .catch((error) => {
        setMessage(error.message)
        setStatus('error')
      })
  }, [])

  if (status === 'checking') {
    return <main className="admin-auth"><p aria-live="polite">Checking sign-in…</p></main>
  }

  if (!token) {
    return (
      <main className="admin-auth">
        <section className="admin-auth__card">
          <OroWordmark className="admin-auth__wordmark" />
          <p className="admin-eyebrow">ORO OBSERVABILITY</p>
          <h1>Admin dashboard</h1>
          <p>Sign in to view bounded, anonymous journey metrics and exports.</p>
          {message && (
            <OroCallout className="admin-status" role="alert" title="Sign-in unavailable" type="error">
              {message}
            </OroCallout>
          )}
          <OroButton onClick={() => startSignIn().catch((error) => setMessage(error.message))}>
            Sign in
          </OroButton>
        </section>
      </main>
    )
  }

  return <Dashboard token={token} />
}

export default App
