import { useMemo, useState } from 'react'
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
const LIMITED_EQUITY_PRODUCT_IDS = new Set(['heloc', 'heloan', 'cash-out-refinance'])

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
  calculationStatus,
  chartState,
  detailProductId,
  onEditInputs,
  onOpenDetail,
  onRemoveDetail,
  onRestart,
  onRetryChart,
  onSelection,
  onTabChange,
  results,
  resultsUpdated = false,
  selectedIds = [],
}) {
  const [chartView, setChartView] = useState('equity')
  const [comparisonMode, setComparisonMode] = useState('summary')
  const [storedEnteredAge, setStoredEnteredAge] = useState(null)
  const [selectionLimitReached, setSelectionLimitReached] = useState(false)
  const allProducts = results?.allProducts || []
  const recommendations = results?.recommendations || []
  const inputs = results?.inputs || {}
  const availableEquity = Number(inputs.homeValue) - Number(inputs.mortgageBalance)
  const limitedEquity = Number.isFinite(availableEquity)
    && Number.isFinite(Number(inputs.cashNeeded))
    && Number(inputs.cashNeeded) > availableEquity
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
  const forceChartError = useMemo(() => {
    if (typeof window === 'undefined') {
      return false
    }

    const params = new URLSearchParams(window.location.search)
    return params.get('chartError') === '1' || params.get('chartState') === 'error'
  }, [])
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
  const effectiveChartState = calculationStatus ? 'loading' : chartState
  const visibleChartSeries = effectiveChartState === 'empty' ? {} : chartSeries

  function renderChartPanel() {
    return (
      <OroChartPanel
        callout={{ body: 'Illustrative estimate only. Actual terms, rates, fees, and home values may differ.' }}
        emptyBody="Enter home details and select products to generate this chart."
        emptyTitle="No comparison data yet"
        error={effectiveChartState === 'error' || forceChartError}
        errorBody="The comparison cards and text values are still available. Revise the inputs or retry the illustrative calculation."
        errorTitle="The chart could not be shown"
        loading={effectiveChartState === 'loading'}
        loadingBody="The selected product labels and accessible text summary will appear when the illustrative values are ready."
        loadingTitle="Preparing the chart"
        onEditSelection={() => onTabChange('all')}
        onReviseAndRecalculate={() => {
          onRetryChart?.()
          onEditInputs()
        }}
        onViewChange={setChartView}
        seriesByView={visibleChartSeries}
        view={chartView}
      />
    )
  }

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
    const limitedByEquity = limitedEquity && LIMITED_EQUITY_PRODUCT_IDS.has(product.id)
    const unavailable = product.ineligible || limitedByEquity
    const isMatch = !results.direct
      && recommendations.some((recommendation) => recommendation.id === product.id)
    const sharedEquityIsLimited = product.availabilityState === 'limited'
    const suitabilityLevel = limitedByEquity
      ? 'limited'
      : product.suitabilityLevel || getSuitabilityLevel(product, recommendations, results.direct)
    const limitedDescription = 'Not available under these estimates because there is not enough estimated accessible equity.'
    const limitedMetrics = [
      { id: 'cash', label: 'Cash available', value: 'Too low' },
      { id: 'next-step', label: 'Next step', value: 'Reduce cash request' },
    ]
    const eligibility = product.eligibility || (unavailable
      ? { status: 'ineligible', label: 'Unavailable' }
      : { status: 'eligible', label: 'Eligible' })

    return (
      <div className="results-panel__card" key={product.id}>
        <OroProductCard
          callout={limitedByEquity ? undefined : getUnavailableCallout(product, enteredAge)}
          description={limitedByEquity ? limitedDescription : product.description}
          emphasis={isMatch && suitabilityLevel === 'strong' ? 'match' : 'standard'}
          eligibility={unavailable
            ? {
              status: 'ineligible',
              label: product.availabilityState === 'too-low'
                ? 'Cash available - Too low'
                : product.id === 'reverse-mortgage' ? 'Unavailable · age 62+' : 'Unavailable',
            }
            : sharedEquityIsLimited
              ? eligibility
              : { status: 'eligible', label: 'Eligible' }}
          metrics={limitedByEquity ? limitedMetrics : [
            { id: 'monthly', label: product.monthlyLabel, value: formatMetric(product.monthly, formatSignedCurrency) },
            { id: 'cash', label: product.cashMetricLabel || 'Cash net', value: formatMetric(product.cashNet) },
          ]}
          mode="comparison"
          name={product.name}
          onSelect={() => handleSelection(product)}
          preserveMetricValuesWhenUnavailable={limitedByEquity}
          selectLabel={selected ? 'Remove from comparison' : 'Add to comparison'}
          state={unavailable ? 'unavailable' : selected ? 'selected' : 'default'}
          suitability={{ level: suitabilityLevel }}
          tradeoff={limitedByEquity
            ? { type: 'consideration', text: 'Reduce cash request or revise details.' }
            : getProductTradeoff(product)}
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
    <main
      aria-busy={Boolean(calculationStatus) || undefined}
      className={`results-panel ${calculationStatus ? 'results-panel--calculating' : ''}`}
      aria-labelledby="results-title"
    >
      <OroStepIndicator
        className="results-panel__progress"
        currentStep={6}
        label={resultsUpdated ? 'Results updated' : 'Options to explore'}
      />
      <header className="results-panel__header">
        <div>
          <p className="results-panel__eyebrow">
            {limitedEquity ? 'Your illustrative results' : 'Illustrative estimate'}
          </p>
          <h1 id="results-title">
            {limitedEquity ? 'Few options are available under these estimates' : 'Your home equity options'}
          </h1>
          <p className="results-panel__intro">
            {limitedEquity
              ? `The ${formatCurrency(Number(inputs.cashNeeded))} cash request is above the estimated accessible equity. Every option remains visible, with a clear reason when it is limited or unavailable.`
              : 'These estimates compare modeled cash, monthly impact, costs, and future equity using the details you entered.'}
          </p>
        </div>
        <div className="results-panel__header-actions">
          <div
            aria-hidden={!calculationStatus || undefined}
            aria-live={calculationStatus ? 'polite' : undefined}
            className={`results-panel__calculation-status ${calculationStatus ? '' : 'is-hidden'}`}
            role={calculationStatus ? 'status' : undefined}
          >
            {calculationStatus === 'reviewing'
              ? 'Reviewing illustrative calculations'
              : calculationStatus === 'updating'
                ? 'Updating illustrative calculations'
                : 'Illustrative calculations ready'}
          </div>
          <OroButton variant="secondary" onClick={onEditInputs}>Edit details</OroButton>
        </div>
      </header>

      <OroDisclaimerBlock title="Illustrative information—not financial advice">
        These estimates are for education only. They are not a quote, approval, APR disclosure,
        underwriting decision, or financial advice.
      </OroDisclaimerBlock>

      {(calculationStatus === 'updating' || resultsUpdated) && (
        <OroCallout
          className="results-panel__update-status"
          type={resultsUpdated ? 'success' : 'info'}
          title={resultsUpdated
            ? 'Your illustrative results were updated'
            : 'Updating illustrative calculations'}
          role="status"
        >
          {resultsUpdated
            ? 'The matches, comparison values, and chart examples now reflect the revised information you submitted in this session.'
            : 'The existing values remain visible while the revised inputs are applied. Comparison controls are temporarily paused.'}
        </OroCallout>
      )}

      {limitedEquity && (
        <OroCallout type="warning" title="Limited available equity">
          Home value {formatCurrency(Number(inputs.homeValue))} less mortgage balance {formatCurrency(Number(inputs.mortgageBalance))}{' '}
          leaves about {formatCurrency(availableEquity)} before costs and provider limits. Lower the cash request, revise the estimates, or explore a smaller need.
        </OroCallout>
      )}

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
        <>
          {selectedProducts.length > 0 && (
            <OroResultsComparison
              enteredAge={enteredAge}
              mode={comparisonMode}
              onModeChange={setComparisonMode}
              onOpenDetail={onOpenDetail}
              onSelect={onSelection}
              products={selectedProducts}
            />
          )}
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
          {renderChartPanel()}
          </section>
        </>
      )}

      {activeTab !== 'compare' && (
        <>
          <section className="results-panel__cards" aria-label={tabLabels[activeTab]}>
            {visibleProducts.map(renderCard)}
          </section>
          <section
            className="results-panel__chart-section results-panel__chart-section--preview"
            aria-labelledby="chart-preview-title"
          >
            <div className="results-panel__section-heading">
              <div>
                <p className="results-panel__eyebrow">Comparison preview</p>
                <h2 id="chart-preview-title">See the modeled tradeoffs over time</h2>
              </div>
              <p>Select an option to preview its values, then compare up to three.</p>
            </div>
            {renderChartPanel()}
          </section>
        </>
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

      <div className="results-panel__selection-controls" aria-live="polite">
        <p>
          {selectedIds.length === 0
            ? 'Select 1–3 products to review them in the comparison view.'
            : selectedIds.length === 1
              ? '1 product selected. You can review it now or add up to two more.'
              : `${selectedIds.length} of 3 products selected. You can compare these options now.`}
        </p>
        <OroButton
          disabled={selectedIds.length === 0}
          onClick={() => onTabChange('compare')}
          variant={selectedIds.length > 0 ? 'primary' : 'secondary'}
        >
          Compare selected{selectedIds.length > 0 ? ` (${selectedIds.length})` : ''}
        </OroButton>
      </div>

      <footer className="results-panel__footer">
        <p>Want to start with a different goal or set of home details?</p>
        <OroButton variant="tertiary" onClick={onRestart}>Start over</OroButton>
      </footer>
    </main>
  )
}

export default ResultsPanel
