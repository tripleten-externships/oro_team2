import { OroComparisonRow } from '../oro-comparison-row'
import { OroProductCard } from '../oro-product-card'
import './oro-product-comparison-column.css'

const defaultRows = [
  { id: 'cash', label: 'Estimated cash available', value: '$50,000' },
  { id: 'monthly', label: 'Estimated monthly impact', value: '$0' },
  { id: 'equity', label: 'Estimated equity at year 10', value: '$286,000' },
  { id: 'ownership', label: 'Ownership outcome', value: 'Retain ownership' },
  { id: 'eligibility', label: 'Eligibility', value: '✓ Eligible' },
  { id: 'repayment', label: 'Repayment pattern', value: 'No required monthly payment' },
  { id: 'return', label: 'Interest or return structure', value: 'Varies by product' },
  { id: 'costs', label: 'Closing costs', value: 'Ask for a written estimate' },
  { id: 'qualification', label: 'Qualification considerations', value: 'Provider rules apply' },
  { id: 'age', label: 'Age restrictions', value: 'Varies by product' },
  { id: 'benefit', label: 'Main benefit', value: 'Educational summary' },
  { id: 'tradeoff', label: 'Main tradeoff', value: 'Educational summary' },
  { id: 'fit', label: 'Best suited for', value: 'Situation-dependent' },
  { id: 'risks', label: 'Important risks', value: 'Review before deciding' },
]

function OroProductComparisonColumn({
  product = {},
  rows = defaultRows,
  onSelect,
  className = '',
}) {
  const classes = [
    'oro-product-comparison-column',
    className,
  ].filter(Boolean).join(' ')
  const visibleRows = Array.isArray(rows) ? rows : defaultRows

  return (
    <section className={classes} aria-label={`${product.name || 'Product'} comparison`}>
      <OroProductCard
        {...product}
        mode="comparison"
        showMetrics={false}
        onSelect={onSelect}
        className="oro-product-comparison-column__product"
      />
      <div className="oro-product-comparison-column__rows">
        {visibleRows.map((row, index) => (
          <OroComparisonRow
            key={row.id || `${row.label}-${index}`}
            label={row.label}
            value={row.value}
          />
        ))}
      </div>
    </section>
  )
}

export default OroProductComparisonColumn
