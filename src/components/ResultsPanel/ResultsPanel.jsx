import { useEffect, useMemo, useState } from 'react'
import {
  formatCurrency,
  formatSignedCurrency,
} from '../../application/mortgage-view-model.js'
import { OroButton } from '../oro-button'
import { OroCallout } from '../oro-callout'
import { OroChartPanel } from '../oro-chart-panel'
import { OroDisclaimerBlock } from '../oro-disclaimer-block'
import { OroProductCard } from '../oro-product-card'
import { OroProductDetailPanel } from '../oro-product-detail-panel'
import { OroResultsComparison } from '../oro-results-comparison'
import { OroStepIndicator } from '../oro-step-indicator'
import './ResultsPanel.css'

const tabLabels = {
  matches: 'Your matches',
  all: 'All 7 options',
  compare: 'Compare selected',
}

const tabOrder = Object.keys(tabLabels)
const STORAGE_KEY = 'oro-home-equity-explorer'

function formatMetric(value, formatter = formatCurrency) {
  return value === null ? '—' : formatter(value)
}

function getProductTradeoff(product) {
  if (product.monthly > 0) {
    return { type: 'benefit', text: product.risk }
  }

  return { type: 'consideration', text: product.risk }
}

function getEnteredAge(results) {
  const candidates = [
    results?.inputs?.age,
    results?.age,
    results?.homeownerAge,
    results?.homeOwnerAge,
  ]
  const rawAge = candidates.find((candidate) => Number.isFinite(Number(candidate)))
  return rawAge === undefined ? null : Number(rawAge)
}

function getStoredEnteredAge() {
  try {
    const stored = JSON.parse(globalThis.localStorage?.getItem(STORAGE_KEY) || 'null')
    const rawAge = stored?.inputs?.age
    return rawAge !== null && rawAge !== undefined && Number.isFinite(Number(rawAge))
      ? Number(rawAge)
      : null
  } catch {
    return null
  }
}

function getSuitabilityLevel(product, recommendations, direct) {
  if (product.ineligible) {
    return 'limited'
  }

  const recommendation = recommendations.find((item) => item.id === product.id)
  if (!recommendation || direct) {
    return 'possible'
  }

  const topScore = recommendations[0]?.score
  const secondScore = recommendations[1]?.score
  const isClearTopMatch = recommendation.score === topScore
    && (secondScore === undefined || topScore - secondScore > 1)

  return isClearTopMatch ? 'strong' : 'possible'
}

function getUnavailableCallout(product, enteredAge) {
  if (!product.ineligible || product.id !== 'reverse-mortgage') {
    return undefined
  }

  const ageText = Number.isFinite(enteredAge)
    ? `Entered age: ${enteredAge}. `
    : 'The entered age is below 62. '
  return {
    type: 'neutral',
    title: 'Not available for the entered age',
    body: `${ageText}Reverse mortgages require age 62+. This option remains visible for education.`,
  }
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
  const [comparisonMode, setComparisonMode] = useState('summary')
  const [storedEnteredAge, setStoredEnteredAge] = useState(null)
  const [selectionLimitReached, setSelectionLimitReached] = useState(false)
  const allProducts = results?.allProducts || []
  const recommendations = results?.recommendations || []
  const selectedProducts = selectedIds
    .map((id) => allProducts.find((product) => product.id === id))
    .filter(Boolean)
  const detailProduct = allProducts.find((product) => product.id === detailProductId)
  const enteredAge = getEnteredAge(results) ?? storedEnteredAge

  useEffect(() => {
    const timeoutId = globalThis.setTimeout(() => {
      setStoredEnteredAge(getStoredEnteredAge())
    }, 0)

    return () => globalThis.clearTimeout(timeoutId)
  }, [results])
  const visibleProducts = activeTab === 'matches'
    ? recommendations
    : activeTab === 'compare'
      ? selectedProducts
      : allProducts

  useEffect(() => {
    if (activeTab === 'compare' && selectedIds.length < 2) {
      onTabChange('all')
    }
  }, [activeTab, onTabChange, selectedIds.length])

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

  function renderCard(product) {
    const selected = selectedIds.includes(product.id)
    const unavailable = product.ineligible
    const isMatch = !results.direct
      && recommendations.some((recommendation) => recommendation.id === product.id)
    const suitabilityLevel = getSuitabilityLevel(product, recommendations, results.direct)

    return (
      <div className="results-panel__card" key={product.id}>
        <OroProductCard
          callout={getUnavailableCallout(product, enteredAge)}
          description={product.description}
          emphasis={isMatch && suitabilityLevel === 'strong' ? 'match' : 'standard'}
          eligibility={unavailable
            ? {
              status: 'ineligible',
              label: product.id === 'reverse-mortgage' ? 'Unavailable · age 62+' : 'Unavailable',
            }
            : { status: 'eligible', label: 'Eligible' }}
          metrics={[
            { id: 'monthly', label: product.monthlyLabel, value: formatMetric(product.monthly, formatSignedCurrency) },
            { id: 'cash', label: 'Cash net', value: formatMetric(product.cashNet) },
          ]}
          mode="comparison"
          name={product.name}
          onSelect={() => handleSelection(product)}
          selectLabel={selected ? 'Remove from comparison' : 'Add to comparison'}
          state={unavailable ? 'unavailable' : selected ? 'selected' : 'default'}
          suitability={{ level: suitabilityLevel }}
          tradeoff={getProductTradeoff(product)}
          unavailableLabel={product.id === 'reverse-mortgage' ? 'Unavailable · age 62+' : 'Not available'}
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
      <OroStepIndicator
        className="results-panel__progress"
        currentStep={6}
        label="Options to explore"
      />
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

      <OroDisclaimerBlock title="Illustrative information—not financial advice">
        These estimates are for education only. They are not a quote, approval, APR disclosure,
        underwriting decision, or financial advice.
      </OroDisclaimerBlock>

      {results.hasCloseMatch && activeTab === 'matches' && (
        <OroCallout type="info" title="Two options may fit similarly">
          Your answers point to more than one reasonable path. Compare the tradeoffs
          before choosing a next step.
        </OroCallout>
      )}

      <nav className="results-panel__tabs" aria-label="Results views" role="tablist">
        {tabOrder.map((tab) => {
          const isSelected = activeTab === tab
          const isDisabled = tab === 'compare' && selectedIds.length < 2

          return (
            <button
              aria-selected={isSelected}
              className={`results-panel__tab ${isSelected ? 'selected' : ''}`}
              disabled={isDisabled}
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

      <div className="results-panel__selection-controls" aria-live="polite">
        <p>
          {selectedIds.length === 0
            ? 'Select 2–3 products to compare them side by side.'
            : selectedIds.length === 1
              ? '1 product selected. Select at least one more to enable comparison.'
              : `${selectedIds.length} of 3 products selected. You can compare these options now.`}
        </p>
        <OroButton
          disabled={selectedIds.length < 2}
          onClick={() => onTabChange('compare')}
          variant={selectedIds.length >= 2 ? 'primary' : 'secondary'}
        >
          Compare selected{selectedIds.length > 0 ? ` (${selectedIds.length})` : ''}
        </OroButton>
      </div>

      {selectionLimitReached && (
        <OroCallout type="warning" title="You can compare up to three options">
          Remove one selection before adding another product.
        </OroCallout>
      )}

      {activeTab === 'all'
        && allProducts.some((product) => product.id === 'reverse-mortgage' && product.ineligible) && (
        <OroCallout type="neutral" title="Reverse mortgage remains visible">
          At age {Number.isFinite(enteredAge) ? enteredAge : 'the entered age'}, it is unavailable
          for estimates but still available for neutral education.
        </OroCallout>
      )}

      {activeTab === 'compare' && selectedProducts.length > 0 && (
        <>
          <OroResultsComparison
            enteredAge={enteredAge}
            mode={comparisonMode}
            onModeChange={setComparisonMode}
            onOpenDetail={onOpenDetail}
            onSelect={onSelection}
            products={selectedProducts}
          />
          <section className="results-panel__chart-section" aria-labelledby="chart-section-title">
          <div className="results-panel__section-heading">
            <div>
              <p className="results-panel__eyebrow">Selected options</p>
              <h2 id="chart-section-title">See the modeled tradeoffs over time</h2>
            </div>
            <p>Negative values indicate a payment or reduced equity; positive values indicate income.</p>
          </div>
          <OroChartPanel
            callout={{ body: 'Illustrative estimate only. Actual terms, rates, fees, and home values may differ.' }}
            onViewChange={setChartView}
            seriesByView={chartSeries}
            view={chartView}
          />
          </section>
        </>
      )}

      {activeTab === 'compare' && selectedProducts.length === 0 && (
        <div className="results-panel__empty">
          <h2>Choose options to compare</h2>
          <p>Select up to three products from the other tabs to see their modeled paths together.</p>
          <OroButton variant="secondary" onClick={() => onTabChange('all')}>Browse all options</OroButton>
        </div>
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
            eligibility={detailProduct.ineligible
              ? {
                status: 'ineligible',
                label: detailProduct.id === 'reverse-mortgage'
                  ? 'Unavailable · age 62+'
                  : 'Not available for this profile',
              }
              : undefined}
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
