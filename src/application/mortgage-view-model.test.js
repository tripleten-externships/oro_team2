import assert from 'node:assert/strict'
import test from 'node:test'
import { getResults } from './mortgage-view-model.js'

const inputs = {
  homeValue: 750000,
  mortgageBalance: 350000,
  currentMortgageRateAnnualPercent: 4.5,
  yearsRemaining: 22,
  cashNeeded: 100000,
  age: 62,
}

const answers = {
  goal: 'income',
  stay: 'yes',
  payment: 'no',
  priority: 'cash',
}

test('maps guided answers to ranked view products and chart series', () => {
  const results = getResults(inputs, answers)

  assert.equal(results.recommendations[0].id, 'reverse-mortgage')
  assert.equal(results.recommendations[0].score, 7)
  assert.equal(results.allProducts.length, 7)
  assert.equal(results.seriesByView.equity.length, 7)
  const reverseSeries = results.seriesByView['monthly-impact']
    .find((series) => series.id === 'reverse-mortgage')
  assert.equal(reverseSeries.value, 500)
})

test('builds direct comparison without requiring recommendation answers', () => {
  const results = getResults(inputs, {}, true)

  assert.equal(results.allProducts.length, 7)
  assert.equal(results.recommendations.length, 3)
  assert.equal(results.hasCloseMatch, false)
})

test('keeps an ineligible reverse mortgage visible with unavailable values', () => {
  const results = getResults({ ...inputs, age: 55 }, answers)
  const reverse = results.allProducts.find((product) => product.id === 'reverse-mortgage')

  assert.equal(reverse.ineligible, true)
  assert.equal(reverse.cashNet, null)
  assert.equal(reverse.projections, null)
})

test('keeps limited-equity review data calculable for the warning flow', () => {
  const results = getResults({
    ...inputs,
    homeValue: 350000,
    mortgageBalance: 320000,
    cashNeeded: 100000,
  }, {}, true)

  assert.equal(results.inputs.homeValue, 350000)
  assert.equal(results.inputs.mortgageBalance, 320000)
  assert.equal(results.inputs.cashNeeded, 100000)
  assert.ok(results.allProducts.every((product) => (
    product.cashNet === null || Number.isFinite(product.cashNet)
  )))
})

test('applies limited-equity messaging for shared-equity products', () => {
  const results = getResults({
    homeValue: 350000,
    mortgageBalance: 320000,
    currentMortgageRateAnnualPercent: 4.5,
    yearsRemaining: 22,
    cashNeeded: 100000,
    age: 55,
  }, {}, true)
  const heloc = results.allProducts.find((product) => product.id === 'heloc')
  const heloan = results.allProducts.find((product) => product.id === 'heloan')
  const refinance = results.allProducts.find((product) => product.id === 'cash-out-refinance')
  const hei = results.allProducts.find((product) => product.id === 'home-equity-investment')
  const coOwnership = results.allProducts.find((product) => product.id === 'co-ownership')

  assert.equal(heloc.ineligible, true)
  assert.equal(heloc.eligibility.label, 'Cash available - Too low')
  assert.equal(heloan.ineligible, true)
  assert.equal(heloan.eligibility.label, 'Cash available - Too low')
  assert.equal(refinance.ineligible, true)
  assert.equal(refinance.eligibility.label, 'Cash available - Too low')

  assert.equal(hei.ineligible, false)
  assert.equal(hei.eligibility.label, 'Cash available - Limited')
  assert.equal(hei.suitabilityLevel, 'possible')
  assert.equal(hei.cashMetricLabel, 'Cash available - Limited')
  assert.equal(
    hei.tradeoff.text,
    'Tradeoff - Shared appreciation. Request less cash; share future value.',
  )

  assert.equal(coOwnership.ineligible, false)
  assert.equal(coOwnership.eligibility.label, 'Cash available - Limited')
  assert.equal(coOwnership.suitabilityLevel, 'possible')
  assert.equal(coOwnership.cashMetricLabel, 'Cash available - Limited')
  assert.equal(
    coOwnership.tradeoff.text,
    'Tradeoff - Shared ownership. Request less cash; share future value.',
  )
})
