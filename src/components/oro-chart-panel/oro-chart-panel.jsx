import { useEffect, useId, useState } from 'react'
import { OroButton } from '../oro-button'
import { OroChartContainer } from '../oro-chart-container'
import { OroViewTab } from '../oro-view-tab'
import './oro-chart-panel.css'

const viewOptions = [
  {
    id: 'equity',
    label: 'Equity remaining',
    title: 'Estimated home equity over time',
    description: 'Illustrative estimates based on the answers entered. Direct labels identify every series.',
    kind: 'line',
    caption: 'Illustrative estimate: compare the direction and tradeoff of each option, not a guaranteed future value.',
  },
  {
    id: 'cumulative-cost',
    label: 'Cumulative cost',
    title: 'Estimated cumulative cost over time',
    description: 'Illustrative estimates based on the answers entered. Direct labels identify every series.',
    kind: 'line',
    caption: 'Costs accumulate differently over time. Compare the period you expect to remain in the home.',
  },
  {
    id: 'monthly-impact',
    label: 'Monthly impact',
    title: 'Estimated monthly impact',
    description: 'Illustrative monthly payment or income impact by product.',
    kind: 'bar',
    caption: 'Payment-free products may exchange ownership or future appreciation instead of requiring a monthly loan payment.',
  },
]

const tones = new Set(['primary', 'accent', 'neutral'])
const toneOrder = ['primary', 'accent', 'neutral']
const patternOrder = ['solid', 'dashed', 'dotted']

function normalizeSeries(rawSeries, kind) {
  if (!Array.isArray(rawSeries)) {
    return []
  }

  return rawSeries.map((item, index) => {
    const baseSeries = {
      id: item?.id || `series-${index}`,
      label: item?.label || `Series ${index + 1}`,
      tone: tones.has(item?.tone) ? item.tone : toneOrder[index % toneOrder.length],
      pattern: patternOrder.includes(item?.pattern)
        ? item.pattern
        : patternOrder[index % patternOrder.length],
    }

    if (kind === 'bar') {
      return Number.isFinite(item?.value)
        ? { ...baseSeries, value: item.value }
        : null
    }

    const points = Array.isArray(item?.points)
      ? item.points
        .filter((point) => Number.isFinite(point?.x) && Number.isFinite(point?.y))
        .sort((left, right) => left.x - right.x)
      : []

    return points.length > 0 ? { ...baseSeries, points } : null
  }).filter(Boolean)
}

function createValueFormatter(view) {
  return (value) => {
    const formatted = new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 0,
    }).format(value)

    return view === 'monthly-impact' ? `$${formatted}` : `$${formatted}K`
  }
}

function OroChartPanel({
  view = 'equity',
  onViewChange,
  seriesByView = {},
  callout,
  selectedSeriesId,
  onSeriesSelect,
  errorState = false,
  onEditSelection,
  onReviseAndRecalculate,
  minimumLoadingMs = 700,
  className = '',
}) {
  const generatedId = useId().replace(/:/g, '')
  const [internalSelectedSeriesId, setInternalSelectedSeriesId] = useState()
  const activeView = viewOptions.find((option) => option.id === view) || viewOptions[0]
  const [loadingViewId, setLoadingViewId] = useState(activeView.id)
  const series = normalizeSeries(seriesByView?.[activeView.id], activeView.kind)
  const hasData = series.length > 0
  const isLoading = hasData && loadingViewId === activeView.id
  const panelId = `${generatedId}-chart-panel`
  const effectiveSelectedSeriesId = selectedSeriesId ?? internalSelectedSeriesId
  const classes = ['oro-chart-panel', className].filter(Boolean).join(' ')

  function selectView(nextView) {
    setLoadingViewId(nextView)
    onViewChange?.(nextView)
  }

  function selectSeries(seriesId) {
    const nextSeriesId = effectiveSelectedSeriesId === seriesId ? undefined : seriesId
    if (selectedSeriesId === undefined) {
      setInternalSelectedSeriesId(nextSeriesId)
    }
    onSeriesSelect?.(nextSeriesId)
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

  useEffect(() => {
    if (!isLoading) {
      return undefined
    }

    const timeoutId = setTimeout(() => {
      setLoadingViewId((current) => (current === activeView.id ? null : current))
    }, minimumLoadingMs)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [activeView.id, isLoading, minimumLoadingMs])

  return (
    <section className={classes}>
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

      <div
        id={panelId}
        role="tabpanel"
        aria-labelledby={`${generatedId}-${activeView.id}-tab`}
      >
        {errorState ? (
          <section className="oro-chart-panel__error" role="alert" aria-live="assertive">
            <div className="oro-chart-panel__error-marker" aria-hidden="true">!</div>
            <h3>The chart could not be shown</h3>
            <p>
              The comparison cards and text values are still available. Revise the inputs or
              retry the illustrative calculation.
            </p>
            <div className="oro-chart-panel__error-actions">
              <OroButton variant="secondary" onClick={onEditSelection}>Edit selection</OroButton>
              <OroButton onClick={onReviseAndRecalculate}>Revise and recalculate</OroButton>
            </div>
          </section>
        ) : isLoading ? (
          <section className="oro-chart-panel__loading" role="status" aria-live="polite">
            <div className="oro-chart-panel__loading-marker" aria-hidden="true">i</div>
            <h3>Preparing the chart</h3>
            <p>
              The selected product labels and accessible text summary will appear when the
              illustrative values are ready.
            </p>
          </section>
        ) : (
          <OroChartContainer
            title={activeView.title}
            description={activeView.description}
            series={series}
            kind={activeView.kind}
            selectedSeriesId={effectiveSelectedSeriesId}
            onSeriesSelect={selectSeries}
            valueFormatter={createValueFormatter(activeView.id)}
            caption={callout?.body || activeView.caption}
          />
        )}
      </div>
    </section>
  )
}

export default OroChartPanel
