import { useMemo, useState } from 'react'
import {
  formatCurrency,
  formatSignedCurrency,
} from '../../application/mortgage-view-model.js'
import { OroButton } from '../oro-button'
import { OroCallout } from '../oro-callout'
import { OroChartPanel } from '../oro-chart-panel'
import { OroProductCard } from '../oro-product-card'
import { OroProductDetailPanel } from '../oro-product-detail-panel'
import './ResultsPanel.css'

const tabLabels = {
  matches: 'Your matches',
  all: 'All 7 options',
  compare: 'Compare selected',
}

const tabOrder = Object.keys(tabLabels)

function formatMetric(value, formatter = formatCurrency) {
  return value === null ? '—' : formatter(value)
}

function getProductTradeoff(product) {
  if (product.tradeoff) {
    return product.tradeoff
  }

  if (product.monthly > 0) {
    return { type: 'benefit', text: product.risk }
  }

  return { type: 'consideration', text: product.risk }
}

function ResultsPanel({
  activeTab = 'matches',
  detailProductId,
  onEditInputs,
  onOpenDetail,
  onRemoveDetail,
  onRestart,
  onSelection,
  onTabChange,
  results,
  selectedIds = [],
}) {
  const [chartView, setChartView] = useState('equity')
  const [selectionLimitReached, setSelectionLimitReached] = useState(false)
  const allProducts = results?.allProducts || []
  const recommendations = results?.recommendations || []
  const selectedProducts = allProducts.filter((product) => selectedIds.includes(product.id))
  const detailProduct = allProducts.find((product) => product.id === detailProductId)
  const visibleProducts = activeTab === 'matches'
    ? recommendations
    : activeTab === 'compare'
      ? selectedProducts
      : allProducts

  const chartSeries = useMemo(() => {
    if (selectedProducts.length === 0) {
      return {}
    }

    return Object.fromEntries(
      Object.entries(results.seriesByView).map(([view, series]) => [
        view,
        series.filter((item) => selectedIds.includes(item.id)),
      ]),
    )
  }, [results.seriesByView, selectedIds, selectedProducts.length])

  function handleSelection(product) {
    if (!selectedIds.includes(product.id) && selectedIds.length >= 3) {
      setSelectionLimitReached(true)
      return
    }

    setSelectionLimitReached(false)
    onSelection(product.id)
  }

  function renderCard(product, index) {
    const selected = selectedIds.includes(product.id)
    const unavailable = product.ineligible
    const isMatch = !results.direct
      && recommendations.some((recommendation) => recommendation.id === product.id)
    const suitabilityLevel = product.suitabilityLevel
      || (unavailable ? 'limited' : isMatch && index === 0 ? 'strong' : 'possible')
    const eligibility = product.eligibility || (unavailable
      ? { status: 'ineligible', label: 'Unavailable' }
      : { status: 'eligible', label: 'Eligible' })

    return (
      <div className="results-panel__card" key={product.id}>
        <OroProductCard
          callout={unavailable ? { type: 'warning', title: 'Not available for this profile' } : undefined}
          description={product.description}
          emphasis={isMatch ? 'match' : 'standard'}
          eligibility={eligibility}
          metrics={[
            { id: 'monthly', label: product.monthlyLabel, value: formatMetric(product.monthly, formatSignedCurrency) },
            { id: 'cash', label: product.cashMetricLabel || 'Cash net', value: formatMetric(product.cashNet) },
          ]}
          mode="comparison"
          name={product.name}
          onSelect={() => handleSelection(product)}
          selectLabel={selected ? 'Remove from comparison' : 'Add to comparison'}
          state={unavailable ? 'unavailable' : selected ? 'selected' : 'default'}
          suitability={{ level: suitabilityLevel }}
          tradeoff={getProductTradeoff(product)}
        />
        <button
          className="results-panel__detail-button"
          onClick={() => onOpenDetail(product.id)}
          type="button"
        >
          See how this option works
        </button>
      </div>
    )
  }

  return (
    <main className="results-panel" aria-labelledby="results-title">
      <header className="results-panel__header">
        <div>
          <p className="results-panel__eyebrow">Illustrative estimate</p>
          <h1 id="results-title">Your home equity options</h1>
          <p className="results-panel__intro">
            These estimates compare modeled cash, monthly impact, costs, and future
            equity using the details you entered.
          </p>
        </div>
        <div className="results-panel__header-actions">
          <OroButton variant="secondary" onClick={onEditInputs}>Edit details</OroButton>
        </div>
      </header>

      {results.hasCloseMatch && activeTab === 'matches' && (
        <OroCallout type="info" title="Two options may fit similarly">
          Your answers point to more than one reasonable path. Compare the tradeoffs
          before choosing a next step.
        </OroCallout>
      )}

      <nav className="results-panel__tabs" aria-label="Results views" role="tablist">
        {tabOrder.map((tab) => {
          const isSelected = activeTab === tab

          return (
            <button
              aria-selected={isSelected}
              className={`results-panel__tab ${isSelected ? 'selected' : ''}`}
              key={tab}
              onClick={() => onTabChange(tab)}
              role="tab"
              type="button"
            >
              {tabLabels[tab]}
              {tab === 'compare' && selectedIds.length > 0 && ` (${selectedIds.length})`}
            </button>
          )
        })}
      </nav>

      {selectionLimitReached && (
        <OroCallout type="warning" title="You can compare up to three options">
          Remove one selection before adding another product.
        </OroCallout>
      )}

      {activeTab === 'compare' && (
        <section className="results-panel__chart-section" aria-labelledby="chart-section-title">
          <div className="results-panel__section-heading">
            <div>
              <p className="results-panel__eyebrow">Selected options</p>
              <h2 id="chart-section-title">See the modeled tradeoffs over time</h2>
            </div>
            <p>
              {selectedProducts.length > 0
                ? 'Negative values indicate a payment or reduced equity; positive values indicate income.'
                : 'Choose products to compare and the chart will populate in this same panel.'}
            </p>
          </div>
          <OroChartPanel
            callout={{ body: 'Illustrative estimate only. Actual terms, rates, fees, and home values may differ.' }}
            onViewChange={setChartView}
            seriesByView={chartSeries}
            view={chartView}
          />
        </section>
      )}

      {activeTab !== 'compare' && (
        <section className="results-panel__cards" aria-label={tabLabels[activeTab]}>
          {visibleProducts.map(renderCard)}
        </section>
      )}

      {activeTab === 'all' && (
        <section className="results-panel__table-section" aria-labelledby="comparison-title">
          <div className="results-panel__section-heading">
            <div>
              <p className="results-panel__eyebrow">At a glance</p>
              <h2 id="comparison-title">Compare all seven options</h2>
            </div>
            <p>— means the product is not available for these inputs.</p>
          </div>
          <div className="results-panel__table-wrap">
            <table className="results-panel__table">
              <caption className="oro-visually-hidden">Modeled comparison of all seven options</caption>
              <thead>
                <tr>
                  <th scope="col">Product</th>
                  <th scope="col">Monthly impact</th>
                  <th scope="col">Cash net</th>
                  <th scope="col">Cost at 10 years</th>
                  <th scope="col">Equity at 10 years</th>
                </tr>
              </thead>
              <tbody>
                {allProducts.map((product) => (
                  <tr key={product.id}>
                    <th scope="row">{product.name}</th>
                    <td>{formatMetric(product.monthly, formatSignedCurrency)}</td>
                    <td>{formatMetric(product.cashNet)}</td>
                    <td>{formatMetric(product.costAt10Years)}</td>
                    <td>{formatMetric(product.equityAt10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {detailProduct && (
        <aside className="results-panel__detail" aria-label={`${detailProduct.name} details`}>
          <OroProductDetailPanel
            definition={detailProduct.description}
            definitionTitle={`How ${detailProduct.name} works`}
            disclaimer="This is an illustrative Oro estimate, not a quote, APR, underwriting decision, or financial advice."
            eligibility={detailProduct.ineligible ? { status: 'ineligible', label: 'Not available for this profile' } : undefined}
            onClose={onRemoveDetail}
            productName={detailProduct.name}
            summary={detailProduct.risk}
            suitability={{ level: detailProduct.ineligible ? 'limited' : 'possible' }}
            tradeoffs={[
              { type: 'benefit', text: `Cash net: ${formatMetric(detailProduct.cashNet)}` },
              { type: 'consideration', text: `Cost at 5 years: ${formatMetric(detailProduct.costAt5Years)}` },
              { type: 'consideration', text: `Equity at 10 years: ${formatMetric(detailProduct.equityAt10)}` },
            ]}
          />
        </aside>
      )}

      <footer className="results-panel__footer">
        <p>Want to start with a different goal or set of home details?</p>
        <OroButton variant="tertiary" onClick={onRestart}>Start over</OroButton>
      </footer>
    </main>
  )
}

export default ResultsPanel
