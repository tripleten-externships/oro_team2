import { useId } from 'react'
import { OroButton } from '../oro-button'
import { OroDisclaimerBlock } from '../oro-disclaimer-block'
import { OroEligibilityBadge } from '../oro-eligibility-badge'
import { OroIconButton } from '../oro-icon-button'
import { OroProductDefinitionSection } from '../oro-product-definition-section'
import { OroSuitabilityIndicator } from '../oro-suitability-indicator'
import './oro-product-detail-panel.css'

function OroProductDetailPanel({
  productName = 'Home equity investment',
  summary = "This option may reduce monthly payment pressure, but it exchanges part of your home's future value for cash today.",
  eligibility = { status: 'eligible' },
  suitability = { level: 'strong' },
  definitionTitle = 'How a home equity investment works',
  definition,
  tradeoffs,
  disclaimer,
  onClose,
  onReturn,
  returnLabel = 'Return to comparison',
  className = '',
}) {
  const generatedId = useId().replace(/:/g, '')
  const titleId = `${generatedId}-product-title`
  const classes = [
    'oro-product-detail-panel',
    className,
  ].filter(Boolean).join(' ')

  return (
    <section className={classes} aria-labelledby={titleId}>
      <header className="oro-product-detail-panel__header">
        <h2 className="oro-product-detail-panel__title" id={titleId}>
          {productName}
        </h2>
        {typeof onClose === 'function' && (
          <OroIconButton
            icon="close"
            label="Close detail panel"
            onClick={onClose}
          />
        )}
      </header>

      <div className="oro-product-detail-panel__status">
        <OroEligibilityBadge {...eligibility} />
        <OroSuitabilityIndicator {...suitability} />
      </div>

      <p className="oro-product-detail-panel__summary">{summary}</p>

      <OroProductDefinitionSection
        title={definitionTitle}
        definition={definition}
        tradeoffs={tradeoffs}
        headingLevel={3}
      />

      <OroDisclaimerBlock>{disclaimer}</OroDisclaimerBlock>

      {typeof onReturn === 'function' && (
        <OroButton variant="secondary" onClick={onReturn}>
          {returnLabel}
        </OroButton>
      )}
    </section>
  )
}

export default OroProductDetailPanel
