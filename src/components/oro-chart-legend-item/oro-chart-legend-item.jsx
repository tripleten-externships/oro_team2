import dashed from '../../assets/charts/oro-chart-legend__dashed.svg'
import dashedSelected from '../../assets/charts/oro-chart-legend__dashed-selected.svg'
import dotted from '../../assets/charts/oro-chart-legend__dotted.svg'
import dottedSelected from '../../assets/charts/oro-chart-legend__dotted-selected.svg'
import solid from '../../assets/charts/oro-chart-legend__solid.svg'
import solidSelected from '../../assets/charts/oro-chart-legend__solid-selected.svg'
import './oro-chart-legend-item.css'

const patterns = new Set(['solid', 'dashed', 'dotted'])
const markerSources = {
  solid: { default: solid, selected: solidSelected },
  dashed: { default: dashed, selected: dashedSelected },
  dotted: { default: dotted, selected: dottedSelected },
}

function OroChartLegendItem({
  label = 'HEI',
  pattern = 'solid',
  selected = false,
  onSelect,
  className = '',
}) {
  const normalizedPattern = String(pattern).toLowerCase()
  const safePattern = patterns.has(normalizedPattern) ? normalizedPattern : 'solid'
  const classes = [
    'oro-chart-legend-item',
    selected && 'oro-chart-legend-item--selected',
    className,
  ].filter(Boolean).join(' ')
  const content = (
    <>
      <img
        className="oro-chart-legend-item__marker"
        src={markerSources[safePattern][selected ? 'selected' : 'default']}
        alt=""
        aria-hidden="true"
      />
      {selected && (
        <span className="oro-chart-legend-item__check" aria-hidden="true">
          ✓
        </span>
      )}
      <span>{label}</span>
    </>
  )

  if (typeof onSelect === 'function') {
    return (
      <button
        className={classes}
        type="button"
        aria-pressed={selected}
        onClick={onSelect}
      >
        {content}
      </button>
    )
  }

  return <span className={classes}>{content}</span>
}

export default OroChartLegendItem
