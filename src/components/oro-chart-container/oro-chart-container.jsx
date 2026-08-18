import { OroChartAxisLabel } from '../oro-chart-axis-label'
import { OroChartLegendItem } from '../oro-chart-legend-item'
import { OroChartTooltip } from '../oro-chart-tooltip'
import { OroEducationalChartCaption } from '../oro-educational-chart-caption'
import './oro-chart-container.css'

const patterns = ['solid', 'dashed', 'dotted']
const tones = new Set(['primary', 'accent', 'neutral'])

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
  const plot = { left: 58, right: 620, top: 36, bottom: 220 }
  const scaleX = (value) => plot.left
    + ((value - minimumX) / xRange) * (plot.right - plot.left)
  const scaleY = (value) => plot.bottom
    - ((value - minimumY) / yRange) * (plot.bottom - plot.top)

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
            <text
              className="oro-chart-container__direct-label"
              x="680"
              y={scaleY(lastPoint.y) + 4}
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
  className = '',
}) {
  const safeKind = kind === 'bar' ? 'bar' : 'line'
  const series = normalizeSeries(rawSeries, safeKind)
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

  return (
    <figure className={classes}>
      <figcaption className="oro-chart-container__heading">
        <h2 className="oro-chart-container__title">{title}</h2>
        <p className="oro-chart-container__description">{description}</p>
      </figcaption>

      {series.length > 0 && (
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
        role="img"
        aria-label={`${title}. ${description}`}
      >
        {series.length > 0 ? (
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
          <div className="oro-chart-container__empty" role="status">
            <strong>{emptyTitle}</strong>
            <span>{emptyBody}</span>
          </div>
        )}
      </div>

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

      <OroEducationalChartCaption>{caption}</OroEducationalChartCaption>
    </figure>
  )
}

export default OroChartContainer
