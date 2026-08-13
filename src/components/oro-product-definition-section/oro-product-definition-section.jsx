import { OroTradeoffRow } from '../oro-tradeoff-row'
import './oro-product-definition-section.css'

const defaultTradeoffs = [
  { type: 'benefit', text: 'Can reduce monthly payment pressure.' },
  {
    type: 'consideration',
    text: "You may keep less of the home's future appreciation.",
  },
  { type: 'requirement', text: 'Terms and availability vary by provider.' },
]

function OroProductDefinitionSection({
  title = 'How this option works',
  definition = "You receive cash today in exchange for sharing a portion of your home's future value. There is typically no required monthly payment.",
  tradeoffs = defaultTradeoffs,
  headingLevel = 2,
  className = '',
}) {
  const classes = [
    'oro-product-definition-section',
    className,
  ].filter(Boolean).join(' ')
  const visibleTradeoffs = Array.isArray(tradeoffs) ? tradeoffs : defaultTradeoffs
  const Heading = headingLevel === 3 ? 'h3' : 'h2'

  return (
    <section className={classes}>
      <Heading className="oro-product-definition-section__title">{title}</Heading>
      <p className="oro-product-definition-section__definition">{definition}</p>
      <div className="oro-product-definition-section__divider" aria-hidden="true" />
      <div className="oro-product-definition-section__tradeoffs">
        {visibleTradeoffs.map((item, index) => (
          <OroTradeoffRow
            key={item.id || `${item.type}-${index}`}
            type={item.type}
            text={item.text}
          />
        ))}
      </div>
    </section>
  )
}

export default OroProductDefinitionSection
