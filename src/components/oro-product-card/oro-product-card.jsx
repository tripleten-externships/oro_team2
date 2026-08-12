import { OroButton } from '../oro-button'
import { OroCallout } from '../oro-callout'
import { OroStatTile } from '../oro-stat-tile'
import './oro-product-card.css'

const states = new Set(['default', 'selected', 'unavailable'])

function OroProductCard({
  name,
  eligibility,
  description,
  state = 'default',
  metrics = [],
  callout,
  onSelect,
  onLearnMore,
  selectLabel,
  learnMoreLabel = 'Explain this option',
  className = '',
}) {
  const safeState = states.has(state) ? state : 'default'
  const isSelected = safeState === 'selected'
  const isUnavailable = safeState === 'unavailable'
  const visibleMetrics = Array.isArray(metrics) ? metrics.slice(0, 2) : []
  const classes = [
    'oro-product-card',
    `oro-product-card--${safeState}`,
    className,
  ].filter(Boolean).join(' ')
  const marker = isUnavailable ? '—' : isSelected ? '✓' : ''
  const markerLabel = selectLabel || (isSelected ? `Deselect ${name}` : `Select ${name}`)

  return (
    <article className={classes}>
      <header className="oro-product-card__header">
        <div className="oro-product-card__identity">
          <h3 className="oro-product-card__name">{name}</h3>
          {eligibility && (
            <p className="oro-product-card__eligibility">{eligibility}</p>
          )}
        </div>
        {typeof onSelect === 'function' ? (
          <button
            className="oro-product-card__marker oro-product-card__marker--interactive"
            type="button"
            aria-label={markerLabel}
            aria-pressed={isSelected}
            disabled={isUnavailable}
            onClick={onSelect}
          >
            <span aria-hidden="true">{marker}</span>
          </button>
        ) : (
          <span className="oro-product-card__marker" aria-hidden="true">
            {marker}
          </span>
        )}
      </header>

      {description && <p className="oro-product-card__description">{description}</p>}

      {visibleMetrics.length > 0 && (
        <div className="oro-product-card__metrics">
          {visibleMetrics.map((metric) => (
            <OroStatTile
              key={metric.id || metric.label}
              label={metric.label}
              value={isUnavailable ? '—' : metric.value}
              helper={metric.helper}
              emphasis={metric.emphasis}
            />
          ))}
        </div>
      )}

      {callout && (
        <OroCallout type={callout.type || 'risk'} title={callout.title}>
          {callout.body}
        </OroCallout>
      )}

      {typeof onLearnMore === 'function' && (
        <OroButton variant="tertiary" onClick={onLearnMore}>
          {learnMoreLabel}
        </OroButton>
      )}
    </article>
  )
}

export default OroProductCard
