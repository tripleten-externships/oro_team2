import { useEffect, useId, useState } from 'react'
import { formatCurrency, formatSignedCurrency } from '../../application/mortgage-view-model.js'
import { OroButton } from '../oro-button'
import { OroProductCard } from '../oro-product-card'
import './oro-results-comparison.css'

const modes = [
  { id: 'summary', label: 'Summary' },
  { id: 'detailed', label: 'Detailed' },
]

function formatMetric(value, formatter = formatCurrency) {
  return value === null || value === undefined ? '—' : formatter(value)
}

function getEligibility(product) {
  if (product.ineligible) {
    return { status: 'ineligible', label: product.id === 'reverse-mortgage' ? 'Unavailable · age 62+' : 'Unavailable' }
  }

  return { status: 'eligible', label: 'Eligible' }
}

function getRows(product) {
  return [
    { id: 'eligibility', label: 'Eligibility', value: getEligibility(product).label },
    { id: 'monthly', label: 'Monthly impact', value: formatMetric(product.monthly, formatSignedCurrency) },
    { id: 'cash', label: 'Cash net', value: formatMetric(product.cashNet) },
    { id: 'cost', label: 'Modeled cost at 10 years', value: formatMetric(product.costAt10Years) },
    { id: 'equity', label: 'Modeled equity at 10 years', value: formatMetric(product.equityAt10) },
    { id: 'ownership', label: 'Ownership outcome', value: product.id === 'sale-leaseback' ? 'Do not keep title' : 'Keep title in this illustration' },
    { id: 'benefit', label: 'Main benefit', value: product.description },
    { id: 'tradeoff', label: 'Main tradeoff', value: product.risk },
  ]
}

function getUnavailableCallout(product, enteredAge) {
  if (!product.ineligible || product.id !== 'reverse-mortgage') {
    return undefined
  }

  const ageText = Number.isFinite(enteredAge) ? `Entered age: ${enteredAge}. ` : 'The entered age is below 62. '
  return {
    type: 'neutral',
    title: 'Not available for the entered age',
    body: `${ageText}Reverse mortgages require age 62+. This option remains visible for education.`,
  }
}

function ProductSummary({ product, onOpenDetail, onSelect, selected, enteredAge }) {
  const unavailable = product.ineligible

  return (
    <div className="oro-results-comparison__summary-card">
      <OroProductCard
        callout={getUnavailableCallout(product, enteredAge)}
        description={product.description}
        eligibility={getEligibility(product)}
        metrics={[
          { id: 'monthly', label: product.monthlyLabel, value: formatMetric(product.monthly, formatSignedCurrency) },
          { id: 'cash', label: 'Cash net', value: formatMetric(product.cashNet) },
        ]}
        mode="comparison"
        name={product.name}
        onSelect={() => onSelect(product.id)}
        selectLabel="Remove from comparison"
        state={unavailable ? 'unavailable' : selected ? 'selected' : 'default'}
        suitability={{ level: unavailable ? 'limited' : 'possible' }}
        tradeoff={{ type: product.monthly > 0 ? 'benefit' : 'consideration', text: product.risk }}
      />
      <button
        className="oro-results-comparison__detail-button"
        onClick={() => onOpenDetail(product.id)}
        type="button"
      >
        See how this option works
      </button>
    </div>
  )
}

function OroResultsComparison({
  enteredAge,
  mode = 'summary',
  onModeChange,
  onOpenDetail,
  onSelect,
  products = [],
}) {
  const [helpOpen, setHelpOpen] = useState(false)
  const headingId = useId().replace(/:/g, '')
  const helpTitleId = `${headingId}-help-title`
  const safeMode = modes.some((item) => item.id === mode) ? mode : 'summary'

  useEffect(() => {
    if (!helpOpen) {
      return undefined
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setHelpOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [helpOpen])

  return (
    <section className="oro-results-comparison" aria-labelledby={`${headingId}-title`}>
      <header className="oro-results-comparison__header">
        <div>
          <p className="oro-results-comparison__eyebrow">Selected options</p>
          <h2 id={`${headingId}-title`}>Compare your selected options</h2>
          <p>Use Summary for the key tradeoffs or Detailed for the same values in a row-by-row view.</p>
        </div>
        <OroButton
          aria-haspopup="dialog"
          className="oro-results-comparison__help-button"
          onClick={() => setHelpOpen(true)}
          variant="tertiary"
        >
          How comparison works
        </OroButton>
      </header>

      <div aria-label="Comparison detail level" className="oro-results-comparison__modes" role="tablist">
        {modes.map((item) => (
          <button
            aria-selected={safeMode === item.id}
            className={safeMode === item.id ? 'selected' : ''}
            key={item.id}
            onClick={() => onModeChange(item.id)}
            role="tab"
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>

      {safeMode === 'summary' ? (
        <div className="oro-results-comparison__summary-grid">
          {products.map((product) => (
            <ProductSummary
              enteredAge={enteredAge}
              key={product.id}
              onOpenDetail={onOpenDetail}
              onSelect={onSelect}
              product={product}
              selected
            />
          ))}
        </div>
      ) : (
        <div className="oro-results-comparison__table-wrap">
          <table className={`oro-results-comparison__table ${products.length === 1 ? 'oro-results-comparison__table--single' : ''}`}>
            <caption className="oro-visually-hidden">Detailed comparison of selected options</caption>
            <thead>
              <tr>
                <th scope="col">Comparison</th>
                {products.map((product) => (
                  <th scope="col" key={product.id}>
                    <span>{product.name}</span>
                    <button
                      className="oro-results-comparison__table-detail"
                      onClick={() => onOpenDetail(product.id)}
                      type="button"
                    >
                      See details
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {getRows(products[0] || {}).map((row, rowIndex) => (
                <tr key={row.id}>
                  <th scope="row">{row.label}</th>
                  {products.map((product) => {
                    const productRow = getRows(product)[rowIndex]
                    return <td key={product.id}>{productRow.value}</td>
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {helpOpen && (
        <div
          aria-label="Comparison help"
          aria-modal="true"
          className="oro-results-comparison__overlay"
          onClick={() => setHelpOpen(false)}
          role="dialog"
        >
          <div
            aria-labelledby={helpTitleId}
            className="oro-results-comparison__dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="oro-results-comparison__dialog-header">
              <h3 id={helpTitleId}>How to read this comparison</h3>
              <button
                aria-label="Close comparison help"
                className="oro-results-comparison__close"
                onClick={() => setHelpOpen(false)}
                type="button"
              >
                ×
              </button>
            </div>
            <p>These values are Oro’s illustrative estimates based on the details you entered. They are not a quote, approval, APR disclosure, or financial advice.</p>
            <p>Selections stay in place when you change modes or open and close a product’s details. You can compare up to three options.</p>
            <OroButton onClick={() => setHelpOpen(false)} variant="secondary">Close</OroButton>
          </div>
        </div>
      )}
    </section>
  )
}

export default OroResultsComparison
