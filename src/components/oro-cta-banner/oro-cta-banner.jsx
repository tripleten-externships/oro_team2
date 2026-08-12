import { OroButton } from '../oro-button'
import './oro-cta-banner.css'

const contentByContext = {
  'continue-comparison': {
    title: 'See how these options compare',
    body: 'Carry your options into the full seven-product comparison. You can change your selection at any time.',
    primaryLabel: 'Compare all 7 options',
    secondaryLabel: 'Back to questions',
  },
  'concierge-support': {
    title: 'See how these options compare',
    body: 'Carry your options into the full seven-product comparison. You can change your selection at any time.',
    primaryLabel: 'Talk with a concierge',
    secondaryLabel: 'Keep exploring',
  },
}

function OroCtaBanner({
  context = 'continue-comparison',
  title,
  body,
  primaryAction = {},
  secondaryAction = {},
  className = '',
}) {
  const safeContext = contentByContext[context] ? context : 'continue-comparison'
  const content = contentByContext[safeContext]
  const { label: primaryLabel = content.primaryLabel, ...primaryProps } = primaryAction
  const { label: secondaryLabel = content.secondaryLabel, ...secondaryProps } = secondaryAction
  const classes = [
    'oro-cta-banner',
    `oro-cta-banner--${safeContext}`,
    className,
  ].filter(Boolean).join(' ')

  return (
    <section className={classes}>
      <div className="oro-cta-banner__copy">
        <h2 className="oro-cta-banner__title">{title || content.title}</h2>
        <p className="oro-cta-banner__body">{body || content.body}</p>
      </div>
      <div className="oro-cta-banner__actions">
        <OroButton {...primaryProps}>{primaryLabel}</OroButton>
        <OroButton {...secondaryProps} variant="secondary">
          {secondaryLabel}
        </OroButton>
      </div>
    </section>
  )
}

export default OroCtaBanner
