import { OroDisclosure } from '../oro-disclosure'
import './oro-product-education-details.css'

const defaultSections = [
  {
    id: 'typical-use',
    title: 'Typical use case',
    body: 'A homeowner wants to understand when this option is commonly considered and whether its timing fits their situation.',
  },
  {
    id: 'costs',
    title: 'Costs and fees',
    body: 'Costs vary by provider. Ask for every upfront fee, ongoing charge, rate assumption, and possible exit cost in writing.',
  },
  {
    id: 'payments',
    title: 'Payment implications',
    body: 'Review whether payments are required, whether they can change, and what happens if income or housing plans change.',
  },
  {
    id: 'equity',
    title: 'Equity implications',
    body: 'Understand how the option may change the share of future home value you retain over time.',
  },
  {
    id: 'eligibility',
    title: 'Eligibility considerations',
    body: 'Availability depends on product rules, property details, age where applicable, credit, income, equity, and provider requirements.',
  },
  {
    id: 'questions',
    title: 'Questions to ask a professional',
    body: 'Ask how the estimate was calculated, what could change, how you exit, and what the total cost may be under different home-value scenarios.',
  },
]

function OroProductEducationDetails({
  title = 'Understand this option in more detail',
  introduction = 'Use these plain-language sections to understand the costs, payment pattern, equity effect, eligibility, and questions worth asking before speaking with a professional.',
  sections = defaultSections,
  defaultOpen = true,
  className = '',
}) {
  const classes = [
    'oro-product-education-details',
    className,
  ].filter(Boolean).join(' ')
  const visibleSections = Array.isArray(sections) ? sections : defaultSections

  return (
    <section className={classes}>
      <h2 className="oro-product-education-details__title">{title}</h2>
      <p className="oro-product-education-details__introduction">{introduction}</p>
      <div className="oro-product-education-details__sections">
        {visibleSections.map((section, index) => (
          <OroDisclosure
            variant="accordion"
            title={section.title}
            defaultOpen={section.open ?? defaultOpen}
            key={section.id || `${section.title}-${index}`}
          >
            {section.body}
          </OroDisclosure>
        ))}
      </div>
    </section>
  )
}

export default OroProductEducationDetails
