import './oro-suitability-indicator.css'

const levels = new Set(['strong', 'possible', 'limited'])
const levelContent = {
  strong: { label: 'Strong match', marker: '●●●' },
  possible: { label: 'Worth exploring', marker: '●●○' },
  limited: { label: 'May not fit', marker: '●○○' },
}

function OroSuitabilityIndicator({
  level = 'strong',
  label,
  showLabel = true,
  className = '',
}) {
  const normalizedLevel = String(level).toLowerCase()
  const safeLevel = levels.has(normalizedLevel) ? normalizedLevel : 'possible'
  const content = levelContent[safeLevel]
  const classes = [
    'oro-suitability-indicator',
    `oro-suitability-indicator--${safeLevel}`,
    className,
  ].filter(Boolean).join(' ')

  return (
    <span
      className={classes}
      aria-label={showLabel ? undefined : (label || content.label)}
    >
      <span className="oro-suitability-indicator__marker" aria-hidden="true">
        {content.marker}
      </span>
      {showLabel && <span>{label || content.label}</span>}
    </span>
  )
}

export default OroSuitabilityIndicator
