import assert from 'node:assert/strict'
import test from 'node:test'
import {
  MortgageCalculator,
  PRODUCT_IDS,
  PROJECTION_YEARS,
  calculateHelocBalance,
  calculateHelocPayment,
  calculateMonthlyPayment,
  calculateRemainingBalance,
} from './mortgage-calculator.js'

const defaultInputs = {
  homeValue: 750000,
  mortgageBalance: 350000,
  currentMortgageRateAnnualPercent: 4.5,
  yearsRemaining: 22,
  cashNeeded: 100000,
  age: 55,
}

function getProduct(products, productId) {
  return products.find((product) => product.id === productId)
}

test('uses documented defaults and keeps the input snapshot immutable', () => {
  const calculator = new MortgageCalculator()
  const inputs = calculator.getInputs()

  assert.deepEqual(inputs, defaultInputs)
  inputs.homeValue = 1
  assert.equal(calculator.getInputs().homeValue, defaultInputs.homeValue)
})

test('normalizes numeric strings from form or localStorage values', () => {
  const calculator = new MortgageCalculator({
    homeValue: '800000',
    mortgageBalance: '300000',
    currentMortgageRateAnnualPercent: '0',
    yearsRemaining: '20',
    cashNeeded: '50000',
    age: '62',
  })

  assert.deepEqual(calculator.getInputs(), {
    homeValue: 800000,
    mortgageBalance: 300000,
    currentMortgageRateAnnualPercent: 0,
    yearsRemaining: 20,
    cashNeeded: 50000,
    age: 62,
  })
})

test('rejects malformed and unsafe inputs', () => {
  assert.throws(
    () => new MortgageCalculator({ cashNeeded: '' }),
    /cashNeeded must be a finite number/,
  )
  assert.throws(
    () => new MortgageCalculator({ homeValue: 0 }),
    /homeValue must be greater than 0/,
  )
  assert.throws(
    () => new MortgageCalculator({ homeValue: 100000001 }),
    /homeValue must be no greater than 100000000/,
  )
  assert.throws(
    () => new MortgageCalculator({ mortgageBalance: -1 }),
    /mortgageBalance must be greater than or equal to 0/,
  )
  assert.throws(
    () => new MortgageCalculator({ age: Number.POSITIVE_INFINITY }),
    /age must be a finite number/,
  )
})

test('handles zero-interest amortization without division errors', () => {
  assert.equal(calculateMonthlyPayment(1200, 0, 12), 100)
  assert.equal(calculateRemainingBalance(1200, 0, 12, 6), 600)

  const refinance = getProduct(
    new MortgageCalculator({ currentMortgageRateAnnualPercent: 0 }).getProducts(),
    'cash-out-refinance',
  )
  assert.ok(Number.isFinite(refinance.monthly))
})

test('uses an amortized balance for HELOAN equity projections', () => {
  const heloan = getProduct(new MortgageCalculator({ age: 62 }).getProducts(), 'heloan')
  const expectedBalance = calculateRemainingBalance(100000, 0.08 / 100 / 12, 180, 60)

  assert.equal(heloan.equityAtYears[4], 440689)
  assert.equal(Math.round(expectedBalance), 66800)
})

test('models HELOC draw and repayment phases explicitly', () => {
  const monthlyRate = 8.5 / 100 / 12
  const heloc = getProduct(new MortgageCalculator({ age: 62 }).getProducts(), 'heloc')

  assert.equal(calculateHelocBalance(100000, monthlyRate, 120), 100000)
  assert.equal(Math.round(calculateHelocBalance(100000, monthlyRate, 121)), 99724)
  assert.equal(Math.round(calculateHelocPayment(100000, monthlyRate, 119)), 708)
  assert.equal(Math.round(calculateHelocPayment(100000, monthlyRate, 120)), 985)
  assert.equal(heloc.projections.monthly[5], -708)
  assert.equal(heloc.projections.monthly[6], -985)
})

test('returns all documented products with serializable projections', () => {
  const products = new MortgageCalculator().getProducts()

  assert.deepEqual(products.map((product) => product.id), PRODUCT_IDS)
  assert.equal(products.length, 7)

  for (const product of products.filter((item) => item.eligible)) {
    assert.deepEqual(product.projections.years, PROJECTION_YEARS)
    assert.equal(product.equityAtYears.length, PROJECTION_YEARS.length)
    assert.equal(product.projections.cash.length, PROJECTION_YEARS.length)
    assert.equal(product.projections.equity.length, PROJECTION_YEARS.length)
    assert.equal(product.projections.cumulativeCost.length, PROJECTION_YEARS.length)
    assert.equal(product.projections.monthly.length, PROJECTION_YEARS.length)
  }
})

test('marks reverse mortgage unavailable before age 62 and available at age 62', () => {
  const ineligible = getProduct(new MortgageCalculator().getProducts(), 'reverse-mortgage')
  const eligible = getProduct(
    new MortgageCalculator({ age: 62 }).getProducts(),
    'reverse-mortgage',
  )

  assert.equal(ineligible.eligible, false)
  assert.equal(ineligible.cashNet, null)
  assert.equal(ineligible.monthly, null)
  assert.equal(ineligible.projections, null)
  assert.equal(eligible.eligible, true)
  assert.ok(eligible.cashNet >= 0)
  assert.equal(eligible.equityAtYears[6], 451834)
})

test('does not create a negative reverse mortgage amount for negative equity', () => {
  const reverse = getProduct(
    new MortgageCalculator({
      homeValue: 300000,
      mortgageBalance: 400000,
      age: 62,
    }).getProducts(),
    'reverse-mortgage',
  )

  assert.equal(reverse.cashNet, 0)
  assert.equal(reverse.cashCost, 0)
  assert.equal(reverse.monthly, 0)
})

test('preserves the documented monthly sign convention', () => {
  const products = new MortgageCalculator({ age: 62 }).getProducts()

  assert.ok(getProduct(products, 'heloc').monthly < 0)
  assert.ok(getProduct(products, 'heloan').monthly < 0)
  assert.ok(getProduct(products, 'cash-out-refinance').monthly < 0)
  assert.ok(getProduct(products, 'reverse-mortgage').monthly > 0)
  assert.equal(getProduct(products, 'home-equity-investment').monthly, 0)
  assert.equal(getProduct(products, 'co-ownership').monthly, 0)
  assert.ok(getProduct(products, 'sale-leaseback').monthly < 0)
  assert.ok(getProduct(products, 'reverse-mortgage').projections.monthly.every((value) => value > 0))
})

test('keeps actual cash net of modelled product costs', () => {
  const products = new MortgageCalculator({ age: 62 }).getProducts()

  assert.equal(getProduct(products, 'home-equity-investment').cashNet, 85000)
  assert.equal(getProduct(products, 'co-ownership').cashNet, 88000)
  assert.equal(getProduct(products, 'sale-leaseback').cashNet, 291250)
})

test('calculates five-year costs from the five-year horizon', () => {
  const products = new MortgageCalculator({ age: 62 }).getProducts()
  const heloan = getProduct(products, 'heloan')

  assert.equal(heloan.costAt5Years, 59839)
  assert.notEqual(heloan.costAt5Years, Math.round(heloan.costAt10Years / 2))
})

test('does not expose negative modeled refinance costs', () => {
  const refinance = getProduct(
    new MortgageCalculator({ currentMortgageRateAnnualPercent: 12 }).getProducts(),
    'cash-out-refinance',
  )

  assert.ok(refinance.costAt5Years >= 0)
  assert.ok(refinance.costAt10Years >= 0)
  assert.ok(refinance.projections.cumulativeCost.every((value) => value >= 0))
})

test('returns the top three scored products using semantic answers', () => {
  const recommendations = new MortgageCalculator({ age: 62 }).getRecommendations({
    goal: 'income',
    longTermStay: 'yes',
    paymentCapacity: 'no',
    priority: 'cash',
  })

  assert.equal(recommendations.length, 3)
  assert.equal(recommendations[0].product.id, 'reverse-mortgage')
  assert.equal(recommendations[0].score, 7)
  assert.ok(recommendations.every(({ product, score }) => product && Number.isFinite(score)))
})

test('uses the canonical documentation score for a lump-sum goal', () => {
  const recommendations = new MortgageCalculator({ age: 62 }).getRecommendations({
    goal: 'lump',
    longTermStay: 'soon',
    paymentCapacity: 'no',
    priority: 'cash',
  })
  const heiRecommendation = recommendations.find(
    ({ product }) => product.id === 'home-equity-investment',
  )

  assert.equal(heiRecommendation.score, 5)
})

test('forces an ineligible reverse mortgage to the lowest recommendation score', () => {
  const recommendations = new MortgageCalculator().getRecommendations({
    goal: 'income',
    longTermStay: 'open',
    paymentCapacity: 'no',
    priority: 'cash',
  })
  const reverseRecommendation = recommendations.find(
    ({ product }) => product.id === 'reverse-mortgage',
  )

  assert.equal(reverseRecommendation, undefined)
})

test('rejects unsupported recommendation answers', () => {
  assert.throws(
    () => new MortgageCalculator().getRecommendations({
      goal: 'unknown',
      longTermStay: 'open',
      paymentCapacity: 'yes',
      priority: 'cost',
    }),
    /answers\.goal has an unsupported value/,
  )
})
