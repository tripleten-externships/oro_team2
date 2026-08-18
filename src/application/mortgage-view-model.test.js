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
