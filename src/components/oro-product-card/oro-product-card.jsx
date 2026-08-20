import { OroButton } from '../oro-button'
import { OroCallout } from '../oro-callout'
import { OroEligibilityBadge } from '../oro-eligibility-badge'
import { OroSuitabilityIndicator } from '../oro-suitability-indicator'
import { OroTradeoffRow } from '../oro-tradeoff-row'
import './oro-product-card.css'

const states = new Set(['default', 'selected', 'unavailable'])
const modes = new Set(['summary', 'comparison'])
const emphases = new Set(['standard', 'match'])

function normalizeOption(value, options, fallback) {
  const normalized = String(value).toLowerCase()
  return options.has(normalized) ? normalized : fallback
}

function resolveEligibility(eligibility, isUnavailable) {
  if (isUnavailable) {
    const label = eligibility && typeof eligibility === 'object'
      ? eligibility.label
      : typeof eligibility === 'string' ? eligibility : undefined
    return { status: 'ineligible', label: label || 'Unavailable' }
  }

  if (eligibility && typeof eligibility === 'object') {
    return eligibility
  }

  if (typeof eligibility === 'string') {
    const status = /unavailable|ineligible/i.test(eligibility)
      ? 'ineligible'
      : 'eligible'
    return { status, label: eligibility }
  }

  return { status: 'eligible', label: 'Eligible' }
}

function resolveSuitability(suitability, emphasis, isUnavailable) {
  if (isUnavailable) {
    return { level: 'limited' }
  }

  if (suitability && typeof suitability === 'object') {
    return suitability
  }

  if (typeof suitability === 'string') {
    const normalized = suitability.toLowerCase()
    return ['strong', 'possible', 'limited'].includes(normalized)
      ? { level: normalized }
      : { level: emphasis === 'match' ? 'strong' : 'possible', label: suitability }
  }

  return { level: emphasis === 'match' ? 'strong' : 'possible' }
}

function resolveTradeoff(tradeoff, callout) {
  if (tradeoff && typeof tradeoff === 'object') {
    return tradeoff
  }

  if (typeof tradeoff === 'string') {
    return { type: 'consideration', text: tradeoff }
  }

  if (callout) {
    const type = callout.type === 'success'
      ? 'benefit'
      : callout.type === 'info' ? 'requirement' : 'consideration'
    return { type, text: callout.body || callout.title }
  }

  return {
    type: 'consideration',
    text: 'Future home equity may be reduced.',
  }
}

function OroProductCard({
  name,
  productName,
  eligibility,
  suitability,
  description,
  definition,
  state = 'default',
  emphasis = 'standard',
  mode = 'summary',
  metrics = [],
  monthlyImpact = 'Monthly impact · $0',
  equityAt10Years = '10-year equity · $286,000',
  showMetrics = true,
  tradeoff,
  callout,
  onSelect,
  onLearnMore,
  selectLabel = 'Select for comparison',
  learnMoreLabel = 'Explain this option',
  unavailableLabel = 'Not available',
  className = '',
}) {
  const safeState = normalizeOption(state, states, 'default')
  const safeMode = normalizeOption(mode, modes, 'summary')
  const safeEmphasis = normalizeOption(emphasis, emphases, 'standard')
  const isUnavailable = safeState === 'unavailable'
  const title = productName || name || 'Home equity option'
  const summary = definition || description || 'Plain-language product definition.'
  const eligibilityContent = resolveEligibility(eligibility, isUnavailable)
  const suitabilityContent = resolveSuitability(
    suitability,
    safeEmphasis,
    isUnavailable,
  )
  const tradeoffContent = resolveTradeoff(tradeoff, callout)
  const visibleMetrics = Array.isArray(metrics) && metrics.length > 0
    ? metrics.slice(0, 2).map((metric) => ({
      id: metric.id || metric.label,
      text: `${metric.label} · ${isUnavailable ? '—' : metric.value}`,
    }))
    : [
      { id: 'monthly-impact', text: isUnavailable ? 'Monthly impact · —' : monthlyImpact },
      { id: 'equity-at-10-years', text: isUnavailable ? '10-year equity · —' : equityAt10Years },
    ]
  const actionHandler = safeMode === 'comparison'
    ? onSelect
    : (onLearnMore || onSelect)
  const actionLabel = isUnavailable
    ? unavailableLabel
    : safeMode === 'comparison' ? selectLabel : learnMoreLabel
  const hasCallout = callout && typeof callout === 'object'
  const classes = [
    'oro-product-card',
    `oro-product-card--${safeState}`,
    `oro-product-card--${safeEmphasis}`,
    `oro-product-card--${safeMode}`,
    className,
  ].filter(Boolean).join(' ')

  return (
    <article className={classes} aria-disabled={isUnavailable || undefined}>
      <h3 className="oro-product-card__name">{title}</h3>
      <p className="oro-product-card__description">{summary}</p>

      <div className="oro-product-card__status">
        <OroEligibilityBadge {...eligibilityContent} />
        <OroSuitabilityIndicator {...suitabilityContent} />
      </div>

      {showMetrics && (
        <dl className="oro-product-card__metrics">
          {visibleMetrics.map((metric) => (
            <div className="oro-product-card__metric" key={metric.id}>
              <dt className="oro-visually-hidden">{metric.id}</dt>
              <dd>{metric.text}</dd>
            </div>
          ))}
        </dl>
      )}

      {hasCallout && (
        <OroCallout
          className="oro-product-card__callout"
          surface="card"
          title={callout.title}
          type={callout.type || 'neutral'}
        >
          {callout.body}
        </OroCallout>
      )}

      <OroTradeoffRow {...tradeoffContent} />

      {typeof actionHandler === 'function' && (
        <OroButton
          className="oro-product-card__action"
          variant="secondary"
          disabled={isUnavailable}
          aria-pressed={safeMode === 'comparison' ? safeState === 'selected' : undefined}
          onClick={actionHandler}
        >
          {actionLabel}
        </OroButton>
      )}
    </article>
  )
}

export default OroProductCard
