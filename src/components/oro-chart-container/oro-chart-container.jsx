import { useId } from 'react'
import { OroChartAxisLabel } from '../oro-chart-axis-label'
import { OroChartLegendItem } from '../oro-chart-legend-item'
import { OroChartTooltip } from '../oro-chart-tooltip'
import { OroEducationalChartCaption } from '../oro-educational-chart-caption'
import { OroButton } from '../oro-button'
import './oro-chart-container.css'

const patterns = ['solid', 'dashed', 'dotted']
const tones = new Set(['primary', 'accent', 'neutral'])
const directLabelGap = 28

function normalizeSeries(rawSeries, kind) {
  if (!Array.isArray(rawSeries)) {
    return []
  }

  return rawSeries.map((item, index) => {
    const base = {
      id: item?.id || `series-${index}`,
      label: item?.label || `Series ${index + 1}`,
      pattern: patterns.includes(item?.pattern) ? item.pattern : patterns[index % patterns.length],
      tone: tones.has(item?.tone) ? item.tone : ['primary', 'accent', 'neutral'][index % 3],
    }

    if (kind === 'bar') {
      return Number.isFinite(item?.value) ? { ...base, value: item.value } : null
    }

    const points = Array.isArray(item?.points)
      ? item.points
        .filter((point) => Number.isFinite(point?.x) && Number.isFinite(point?.y))
        .sort((left, right) => left.x - right.x)
      : []

    return points.length > 0 ? { ...base, points } : null
  }).filter(Boolean)
}

function defaultValueFormatter(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function getDirectLabelPositions(series, scaleY, plot) {
  const minimumY = plot.top + 8
  const maximumY = plot.bottom - 8
  const gap = series.length > 1
    ? Math.min(directLabelGap, (maximumY - minimumY) / (series.length - 1))
    : directLabelGap
  const labels = series
    .map((item, index) => ({
      id: item.id,
      index,
      targetY: scaleY(item.points[item.points.length - 1].y) + 4,
    }))
    .sort((left, right) => left.targetY - right.targetY || left.index - right.index)
  const positions = []

  labels.forEach((label, index) => {
    const previousY = positions[index - 1]?.y
    positions.push({
      ...label,
      y: Math.max(label.targetY, minimumY, previousY === undefined ? minimumY : previousY + gap),
    })
  })

  const overflow = positions.length > 0
    ? positions[positions.length - 1].y - maximumY
    : 0
  if (overflow > 0) {
    positions.forEach((position) => {
      position.y -= overflow
    })
  }

  const underflow = positions.length > 0 ? minimumY - positions[0].y : 0
  if (underflow > 0) {
    positions.forEach((position) => {
      position.y += underflow
    })
  }

  return new Map(positions.map(({ id, y }) => [id, y]))
}

function LineChart({ series, selectedSeriesId, valueFormatter }) {
  const allPoints = series.flatMap((item) => item.points)
  const xValues = allPoints.map(({ x }) => x)
  const yValues = allPoints.map(({ y }) => y)
  const minimumX = Math.min(...xValues)
  const maximumX = Math.max(...xValues)
  const minimumY = Math.min(0, ...yValues)
  const maximumY = Math.max(0, ...yValues)
  const xRange = maximumX - minimumX || 1
  const yRange = maximumY - minimumY || 1
  const plot = { left: 58, right: 438, top: 36, bottom: 220 }
  const labelStartX = 454
  const labelX = 690
  const scaleX = (value) => plot.left
    + ((value - minimumX) / xRange) * (plot.right - plot.left)
  const scaleY = (value) => plot.bottom
    - ((value - minimumY) / yRange) * (plot.bottom - plot.top)
  const directLabelPositions = getDirectLabelPositions(series, scaleY, plot)

  return (
    <svg className="oro-chart-container__svg" viewBox="0 0 704 250" aria-hidden="true">
      {[0.25, 0.5, 0.75].map((position) => (
        <line
          className="oro-chart-container__grid-line"
          x1={plot.left}
          x2={plot.right}
          y1={plot.top + (plot.bottom - plot.top) * position}
          y2={plot.top + (plot.bottom - plot.top) * position}
          key={position}
        />
      ))}
      <line
        className="oro-chart-container__axis"
        x1={plot.left}
        x2={plot.left}
        y1={plot.top}
        y2={plot.bottom}
      />
      <line
        className="oro-chart-container__axis"
        x1={plot.left}
        x2={plot.right}
        y1={plot.bottom}
        y2={plot.bottom}
      />

      {series.map((item) => {
        const isSelected = item.id === selectedSeriesId
        const isDimmed = Boolean(selectedSeriesId) && !isSelected
        const lastPoint = item.points[item.points.length - 1]
        const classes = [
          'oro-chart-container__series',
          `oro-chart-container__series--${item.tone}`,
          `oro-chart-container__series--${item.pattern}`,
          isSelected && 'oro-chart-container__series--selected',
          isDimmed && 'oro-chart-container__series--dimmed',
        ].filter(Boolean).join(' ')

        return (
          <g className={classes} key={item.id}>
            <polyline
              className="oro-chart-container__line"
              points={item.points.map(({ x, y }) => `${scaleX(x)},${scaleY(y)}`).join(' ')}
              vectorEffect="non-scaling-stroke"
            />
            <line
              className="oro-chart-container__label-leader"
              x1={scaleX(lastPoint.x)}
              x2={labelStartX}
              y1={scaleY(lastPoint.y)}
              y2={directLabelPositions.get(item.id) ?? scaleY(lastPoint.y) + 4}
              vectorEffect="non-scaling-stroke"
            />
            <text
              className="oro-chart-container__direct-label"
              x={labelX}
              y={directLabelPositions.get(item.id) ?? scaleY(lastPoint.y) + 4}
              textAnchor="end"
            >
              {item.label} · {valueFormatter(lastPoint.y)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function BarChart({ series, selectedSeriesId, valueFormatter }) {
  const maximumValue = Math.max(1, ...series.map(({ value }) => Math.abs(value)))
  const plot = { left: 58, right: 660, top: 36, bottom: 220 }
  const slotWidth = (plot.right - plot.left) / Math.max(series.length, 1)
  const barWidth = Math.min(52, slotWidth * 0.55)

  return (
    <svg className="oro-chart-container__svg" viewBox="0 0 704 250" aria-hidden="true">
      <line
        className="oro-chart-container__axis"
        x1={plot.left}
        x2={plot.right}
        y1={plot.bottom}
        y2={plot.bottom}
      />
      {series.map((item, index) => {
        const height = (Math.abs(item.value) / maximumValue) * (plot.bottom - plot.top)
        const x = plot.left + index * slotWidth + (slotWidth - barWidth) / 2
        const y = plot.bottom - height
        const classes = [
          'oro-chart-container__series',
          `oro-chart-container__series--${item.tone}`,
          item.id === selectedSeriesId && 'oro-chart-container__series--selected',
          selectedSeriesId && item.id !== selectedSeriesId && 'oro-chart-container__series--dimmed',
        ].filter(Boolean).join(' ')

        return (
          <g className={classes} key={item.id}>
            <rect
              className="oro-chart-container__bar"
              x={x}
              y={y}
              width={barWidth}
              height={Math.max(height, 2)}
              rx="4"
            />
            <text
              className="oro-chart-container__bar-value"
              x={x + barWidth / 2}
              y={Math.max(y - 8, 18)}
              textAnchor="middle"
            >
              {valueFormatter(item.value)}
            </text>
            <text
              className="oro-chart-container__bar-label"
              x={x + barWidth / 2}
              y="242"
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

function OroChartContainer({
  title = 'Estimated home equity over time',
  description = 'Illustrative estimates based on the answers entered. Direct labels identify every series.',
  series: rawSeries = [],
  kind = 'line',
  selectedSeriesId,
  onSeriesSelect,
  valueFormatter = defaultValueFormatter,
  caption,
  emptyTitle = 'No comparison data yet',
  emptyBody = 'Enter home details and select products to generate this chart.',
  error,
  errorTitle = 'The chart could not be shown',
  errorBody = 'The comparison cards and text values are still available. Revise the inputs or retry the illustrative calculation.',
  loading = false,
  loadingTitle = 'Preparing the chart',
  loadingBody = 'The selected product labels and accessible text summary will appear when the illustrative values are ready.',
  onEditSelection,
  onReviseAndRecalculate,
  className = '',
}) {
  const generatedId = useId().replace(/:/g, '')
  const safeKind = kind === 'bar' ? 'bar' : 'line'
  const series = normalizeSeries(rawSeries, safeKind)
  const hasError = Boolean(error)
  const resolvedErrorBody = typeof error === 'string'
    ? error
    : error?.message || errorBody
  const selectedSeries = series.find((item) => item.id === selectedSeriesId)
  const selectedValue = selectedSeries
    ? safeKind === 'line'
      ? selectedSeries.points[selectedSeries.points.length - 1]
      : { x: null, y: selectedSeries.value }
    : null
  const firstYear = safeKind === 'line' && series.length > 0
    ? Math.min(...series.flatMap((item) => item.points.map(({ x }) => x)))
    : null
  const lastYear = safeKind === 'line' && series.length > 0
    ? Math.max(...series.flatMap((item) => item.points.map(({ x }) => x)))
    : null
  const middleYear = firstYear !== null ? Math.round((firstYear + lastYear) / 2) : null
  const classes = ['oro-chart-container', className].filter(Boolean).join(' ')
  const scrollHintId = `${generatedId}-scroll-hint`

  return (
    <figure className={classes}>
      <figcaption className="oro-chart-container__heading">
        <h2 className="oro-chart-container__title">{title}</h2>
        <p className="oro-chart-container__description">{description}</p>
      </figcaption>

      {series.length > 0 && !hasError && !loading && (
        <div className="oro-chart-container__legend" aria-label="Chart series">
          {series.map((item) => (
            <OroChartLegendItem
              key={item.id}
              label={item.label}
              pattern={item.pattern}
              selected={item.id === selectedSeriesId}
              onSelect={typeof onSeriesSelect === 'function'
                ? () => onSeriesSelect(item.id)
                : undefined}
            />
          ))}
        </div>
      )}

      <div
        className="oro-chart-container__plot"
        role={series.length > 0 && !hasError && !loading ? 'img' : undefined}
        aria-label={`${title}. ${description}`}
        aria-describedby={!hasError && series.length > 0 ? scrollHintId : undefined}
      >
        {loading ? (
          <div
            className="oro-chart-container__empty oro-chart-container__empty--loading"
            role="status"
            aria-live="polite"
            aria-busy="true"
          >
            <span
              className="oro-chart-container__empty-marker oro-chart-container__empty-marker--loading"
              aria-hidden="true"
            />
            <strong>{loadingTitle}</strong>
            <span>{loadingBody}</span>
          </div>
        ) : hasError ? (
          <div
            className="oro-chart-container__empty oro-chart-container__empty--error"
            role="alert"
            aria-live="assertive"
          >
            <span className="oro-chart-container__empty-marker" aria-hidden="true">!</span>
            <strong>{errorTitle}</strong>
            <span>{resolvedErrorBody}</span>
            {(onEditSelection || onReviseAndRecalculate) && (
              <div className="oro-chart-container__state-actions">
                {onEditSelection && (
                  <OroButton onClick={onEditSelection} variant="secondary">
                    Edit selection
                  </OroButton>
                )}
                {onReviseAndRecalculate && (
                  <OroButton onClick={onReviseAndRecalculate} variant="primary">
                    Revise and recalculate
                  </OroButton>
                )}
              </div>
            )}
          </div>
        ) : series.length > 0 ? (
          <>
            {safeKind === 'line' ? (
              <LineChart
                series={series}
                selectedSeriesId={selectedSeriesId}
                valueFormatter={valueFormatter}
              />
            ) : (
              <BarChart
                series={series}
                selectedSeriesId={selectedSeriesId}
                valueFormatter={valueFormatter}
              />
            )}
            {safeKind === 'line' && (
              <div className="oro-chart-container__axis-labels" aria-hidden="true">
                <OroChartAxisLabel label={firstYear === 0 ? 'Today' : `Year ${firstYear}`} />
                <OroChartAxisLabel label={`Year ${middleYear}`} />
                <OroChartAxisLabel label={`Year ${lastYear}`} />
              </div>
            )}
            {selectedSeries && selectedValue && (
              <OroChartTooltip
                className="oro-chart-container__tooltip"
                context={`${selectedSeries.label}${selectedValue.x === null ? '' : ` · Year ${selectedValue.x}`}`}
                value={valueFormatter(selectedValue.y)}
              />
            )}
          </>
        ) : (
          <div className="oro-chart-container__empty" role="status" aria-live="polite">
            <span className="oro-chart-container__empty-marker" aria-hidden="true">—</span>
            <strong>{emptyTitle}</strong>
            <span>{emptyBody}</span>
          </div>
        )}
      </div>

      {series.length > 0 && !hasError && !loading && (
        <p className="oro-chart-container__scroll-hint" id={scrollHintId} role="note">
          Swipe horizontally to view the full chart and all labels.
        </p>
      )}

      {!hasError && !loading && (
        <ul className="oro-visually-hidden">
          {series.map((item) => (
            <li key={item.id}>
              {item.label}:{' '}
              {safeKind === 'line'
                ? item.points.map(({ x, y }) => `${x} years, ${valueFormatter(y)}`).join('; ')
                : valueFormatter(item.value)}
            </li>
          ))}
        </ul>
      )}

      <OroEducationalChartCaption>{caption}</OroEducationalChartCaption>
    </figure>
  )
}

export default OroChartContainer
