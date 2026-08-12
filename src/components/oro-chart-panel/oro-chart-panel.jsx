import { useId } from 'react'
import { OroCallout } from '../oro-callout'
import { OroViewTab } from '../oro-view-tab'
import './oro-chart-panel.css'

const viewOptions = [
  {
    id: 'equity',
    label: 'Equity remaining',
    description: 'Years 0, 1, 2, 3, 5, 7, 10, 15, 20 · values in $K',
    kind: 'line',
    yLabel: '$K',
    xLabel: 'Years →',
    callout: {
      title: 'What this chart shows',
      body: 'Sale leaseback reaches and remains at $0 equity because ownership transfers at the start.',
    },
  },
  {
    id: 'cumulative-cost',
    label: 'Cumulative cost',
    description: 'Years 0, 1, 2, 3, 5, 7, 10, 15, 20 · values in $K',
    kind: 'line',
    yLabel: '$K',
    xLabel: 'Years →',
    callout: {
      title: 'What this chart shows',
      body: 'Costs compound differently over time; compare the time horizon you expect to remain in the home.',
    },
  },
  {
    id: 'monthly-impact',
    label: 'Monthly impact',
    description: 'Illustrative monthly payment by product',
    kind: 'bar',
    yLabel: '$ / month',
    xLabel: 'Products',
    callout: {
      title: 'What this chart shows',
      body: 'Payment-free products show little or no loan payment, but may exchange ownership or future appreciation.',
    },
  },
]

const tones = new Set(['primary', 'accent', 'neutral'])
const toneOrder = ['primary', 'accent', 'neutral']
const legendMarkers = { primary: '●', accent: '◆', neutral: '—' }

function normalizeSeries(rawSeries, kind) {
  if (!Array.isArray(rawSeries)) {
    return []
  }

  return rawSeries.map((item, index) => {
    const tone = tones.has(item?.tone) ? item.tone : toneOrder[index % toneOrder.length]
    const baseSeries = {
      id: item?.id || `series-${index}`,
      label: item?.label || `Series ${index + 1}`,
      tone,
    }

    if (kind === 'bar') {
      return typeof item?.value === 'number' && Number.isFinite(item.value)
        ? { ...baseSeries, value: item.value }
        : null
    }

    const points = Array.isArray(item?.points)
      ? item.points
        .filter((point) => point && Number.isFinite(point.x) && Number.isFinite(point.y))
        .sort((left, right) => left.x - right.x)
      : []

    return points.length > 0 ? { ...baseSeries, points } : null
  }).filter(Boolean)
}

function formatValue(value, view) {
  const formatted = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(value)

  return view === 'monthly-impact' ? `$${formatted}` : `$${formatted}K`
}

function LineChart({ series, view, title, description }) {
  const allPoints = series.flatMap((item) => item.points)
  const xValues = allPoints.map(({ x }) => x)
  const yValues = allPoints.map(({ y }) => y)
  const minimumX = Math.min(...xValues)
  const maximumX = Math.max(...xValues)
  const minimumY = Math.min(0, ...yValues)
  const maximumY = Math.max(0, ...yValues)
  const xRange = maximumX - minimumX || 1
  const yRange = maximumY - minimumY || 1
  const plot = { left: 56, right: 590, top: 28, bottom: 240 }
  const scaleX = (value) => plot.left
    + ((value - minimumX) / xRange) * (plot.right - plot.left)
  const scaleY = (value) => plot.bottom
    - ((value - minimumY) / yRange) * (plot.bottom - plot.top)

  return (
    <svg
      className="oro-chart-panel__svg"
      viewBox="0 0 760 290"
      role="img"
      aria-label={`${title}. ${description}`}
    >
      <title>{title}</title>
      <desc>{description}</desc>
      <text className="oro-chart-panel__axis-label" x="12" y="20">$K</text>
      <line
        className="oro-chart-panel__axis"
        x1={plot.left}
        y1={plot.top}
        x2={plot.left}
        y2={plot.bottom}
      />
      <line
        className="oro-chart-panel__axis"
        x1={plot.left}
        y1={scaleY(0)}
        x2={plot.right}
        y2={scaleY(0)}
      />
      <text className="oro-chart-panel__axis-label" x="650" y="274">Years →</text>

      {series.map((item) => {
        const coordinates = item.points
          .map(({ x, y }) => `${scaleX(x)},${scaleY(y)}`)
          .join(' ')
        const lastPoint = item.points[item.points.length - 1]

        return (
          <g
            className={`oro-chart-panel__series oro-chart-panel__series--${item.tone}`}
            key={item.id}
          >
            <polyline
              className="oro-chart-panel__line"
              points={coordinates}
              vectorEffect="non-scaling-stroke"
            />
            <text
              className="oro-chart-panel__series-label"
              x={scaleX(lastPoint.x) + 8}
              y={scaleY(lastPoint.y) + 4}
            >
              {item.label} · {formatValue(lastPoint.y, view)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function BarChart({ series, title, description }) {
  const maximumValue = Math.max(1, ...series.map(({ value }) => Math.abs(value)))
  const plot = { left: 56, right: 700, top: 34, bottom: 230 }
  const slotWidth = (plot.right - plot.left) / Math.max(series.length, 1)
  const barWidth = Math.min(48, slotWidth * 0.55)

  return (
    <svg
      className="oro-chart-panel__svg"
      viewBox="0 0 760 290"
      role="img"
      aria-label={`${title}. ${description}`}
    >
      <title>{title}</title>
      <desc>{description}</desc>
      <text className="oro-chart-panel__axis-label" x="12" y="20">$ / month</text>
      <line
        className="oro-chart-panel__axis"
        x1={plot.left}
        y1={plot.bottom}
        x2={plot.right}
        y2={plot.bottom}
      />
      <text className="oro-chart-panel__axis-label" x="650" y="274">Products</text>

      {series.map((item, index) => {
        const height = (Math.abs(item.value) / maximumValue) * (plot.bottom - plot.top)
        const x = plot.left + index * slotWidth + (slotWidth - barWidth) / 2
        const y = plot.bottom - height

        return (
          <g
            className={`oro-chart-panel__series oro-chart-panel__series--${item.tone}`}
            key={item.id}
          >
            <rect
              className="oro-chart-panel__bar"
              x={x}
              y={y}
              width={barWidth}
              height={Math.max(height, 2)}
              rx="4"
            />
            <text
              className="oro-chart-panel__bar-value"
              x={x + barWidth / 2}
              y={Math.max(y - 8, 18)}
              textAnchor="middle"
            >
              {formatValue(item.value, 'monthly-impact')}
            </text>
            <text
              className="oro-chart-panel__bar-label"
              x={x + barWidth / 2}
              y="252"
              textAnchor="middle"
            >
              {item.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function OroChartPanel({
  view = 'equity',
  onViewChange,
  seriesByView = {},
  callout,
  className = '',
}) {
  const generatedId = useId().replace(/:/g, '')
  const activeView = viewOptions.find((option) => option.id === view) || viewOptions[0]
  const series = normalizeSeries(seriesByView?.[activeView.id], activeView.kind)
  const panelId = `${generatedId}-chart-panel`
  const classes = ['oro-chart-panel', className].filter(Boolean).join(' ')
  const calloutContent = { ...activeView.callout, ...callout }

  function selectView(nextView) {
    if (typeof onViewChange === 'function') {
      onViewChange(nextView)
    }
  }

  function handleTabKeyDown(event) {
    const currentIndex = viewOptions.findIndex((option) => option.id === activeView.id)
    let nextIndex

    if (event.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % viewOptions.length
    } else if (event.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + viewOptions.length) % viewOptions.length
    } else if (event.key === 'Home') {
      nextIndex = 0
    } else if (event.key === 'End') {
      nextIndex = viewOptions.length - 1
    } else {
      return
    }

    event.preventDefault()
    const nextView = viewOptions[nextIndex]
    selectView(nextView.id)
    event.currentTarget.querySelector(`#${generatedId}-${nextView.id}-tab`)?.focus()
  }

  return (
    <section className={classes}>
      <div className="oro-chart-panel__heading">
        <h2 className="oro-chart-panel__title">{activeView.label}</h2>
        <p className="oro-chart-panel__description">{activeView.description}</p>
      </div>

      <div
        className="oro-chart-panel__tabs"
        role="tablist"
        aria-label="Comparison chart view"
        onKeyDown={handleTabKeyDown}
      >
        {viewOptions.map((option) => (
          <OroViewTab
            id={`${generatedId}-${option.id}-tab`}
            controls={panelId}
            key={option.id}
            label={option.label}
            selected={option.id === activeView.id}
            onClick={() => selectView(option.id)}
          />
        ))}
      </div>

      {series.length > 0 && (
        <div className="oro-chart-panel__legend" aria-label="Chart series">
          {series.map((item) => (
            <span
              className={`oro-chart-panel__legend-item oro-chart-panel__legend-item--${item.tone}`}
              key={item.id}
            >
              <span aria-hidden="true">{legendMarkers[item.tone]}</span>
              {item.label}
            </span>
          ))}
        </div>
      )}

      <div
        className="oro-chart-panel__plot"
        id={panelId}
        role="tabpanel"
        aria-labelledby={`${generatedId}-${activeView.id}-tab`}
      >
        {series.length > 0 ? (
          activeView.kind === 'line' ? (
            <LineChart
              series={series}
              view={activeView.id}
              title={activeView.label}
              description={activeView.description}
            />
          ) : (
            <BarChart
              series={series}
              title={activeView.label}
              description={activeView.description}
            />
          )
        ) : (
          <p className="oro-chart-panel__empty">No comparison data available.</p>
        )}
      </div>

      <ul className="oro-visually-hidden">
        {series.map((item) => (
          <li key={item.id}>
            {item.label}:{' '}
            {activeView.kind === 'line'
              ? item.points.map(({ x, y }) => `${x} years, ${formatValue(y, activeView.id)}`).join('; ')
              : formatValue(item.value, activeView.id)}
          </li>
        ))}
      </ul>

      <OroCallout title={calloutContent.title}>
        {calloutContent.body}
      </OroCallout>
    </section>
  )
}

export default OroChartPanel
