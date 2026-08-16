import { scoreProducts } from './mortgage-recommendations.js'

const DEFAULT_INPUTS = Object.freeze({
  homeValue: 750000,
  mortgageBalance: 350000,
  currentMortgageRateAnnualPercent: 4.5,
  yearsRemaining: 22,
  cashNeeded: 100000,
  age: 55,
})

const INPUT_RULES = Object.freeze({
  homeValue: { minimum: 0, exclusive: true },
  mortgageBalance: { minimum: 0 },
  currentMortgageRateAnnualPercent: { minimum: 0 },
  yearsRemaining: { minimum: 0, exclusive: true },
  cashNeeded: { minimum: 0 },
  age: { minimum: 0 },
})

const PROJECTION_YEARS = Object.freeze([0, 1, 2, 3, 5, 7, 10, 15, 20])

const PRODUCT_IDS = Object.freeze([
  'heloc',
  'heloan',
  'cash-out-refinance',
  'reverse-mortgage',
  'home-equity-investment',
  'co-ownership',
  'sale-leaseback',
])

const ANNUAL_HOME_APPRECIATION_RATE = 0.03
const HOME_GROWTH_FACTOR = 1 + ANNUAL_HOME_APPRECIATION_RATE
const REFINANCE_ANNUAL_RATE = 7.25
const REFINANCE_MONTHS = 30 * 12
const HELOC_ANNUAL_RATE = 8.5
const HELOC_DRAW_MONTHS = 10 * 12
const HELOC_REPAYMENT_MONTHS = 15 * 12
const HELOAN_ANNUAL_RATE = 8
const HELOAN_MONTHS = 15 * 12
const REVERSE_ANNUAL_RATE = 7.5
const REVERSE_GROWTH_FACTOR = 1 + REVERSE_ANNUAL_RATE / 100
const REVERSE_MINIMUM_AGE = 62
const HEI_SHARE = 0.15
const HEI_DISCOUNT = 0.88
const HEI_CASH_COST_RATE = 0.03
const CO_OWNERSHIP_DISCOUNT = 0.9
const CO_OWNERSHIP_CASH_COST_RATE = 0.02
const MAX_CO_OWNERSHIP_SHARE = 0.49
const SALE_LEASEBACK_PRICE_FACTOR = 0.875
const SALE_LEASEBACK_RENT_RATE = 0.005
const SALE_LEASEBACK_CASH_COST_RATE = 0.02

function normalizeNumericInput(rawInputs, key) {
  if (!Object.hasOwn(rawInputs, key)) {
    return DEFAULT_INPUTS[key]
  }

  const rawValue = rawInputs[key]
  const numericValue = typeof rawValue === 'string'
    ? rawValue.trim() === '' ? Number.NaN : Number(rawValue)
    : rawValue

  if (typeof numericValue !== 'number' || !Number.isFinite(numericValue)) {
    throw new TypeError(`${key} must be a finite number`)
  }

  const { minimum, exclusive } = INPUT_RULES[key]
  const isBelowMinimum = exclusive
    ? numericValue <= minimum
    : numericValue < minimum

  if (isBelowMinimum) {
    const comparison = exclusive ? 'greater than' : 'greater than or equal to'
    throw new RangeError(`${key} must be ${comparison} ${minimum}`)
  }

  return numericValue
}

function normalizeInputs(rawInputs) {
  if (!rawInputs || typeof rawInputs !== 'object' || Array.isArray(rawInputs)) {
    throw new TypeError('inputs must be an object')
  }

  return Object.freeze(
    Object.fromEntries(
      Object.keys(DEFAULT_INPUTS).map((key) => [key, normalizeNumericInput(rawInputs, key)]),
    ),
  )
}

function annualRateToMonthlyDecimal(annualRatePercent) {
  return annualRatePercent / 100 / 12
}

function roundCurrency(value) {
  return Math.round(value)
}

function calculateMonthlyPayment(principalDollars, monthlyRate, numberOfPayments) {
  if (!Number.isFinite(principalDollars) || principalDollars < 0) {
    throw new RangeError('principalDollars must be a non-negative finite number')
  }

  if (!Number.isFinite(monthlyRate) || monthlyRate < 0) {
    throw new RangeError('monthlyRate must be a non-negative finite number')
  }

  if (!Number.isFinite(numberOfPayments) || numberOfPayments <= 0) {
    throw new RangeError('numberOfPayments must be a positive finite number')
  }

  if (monthlyRate === 0) {
    return principalDollars / numberOfPayments
  }

  const growthFactor = (1 + monthlyRate) ** numberOfPayments
  return principalDollars * monthlyRate * growthFactor / (growthFactor - 1)
}

function calculateRemainingBalance(
  principalDollars,
  monthlyRate,
  totalPayments,
  paymentsMade,
) {
  if (!Number.isFinite(paymentsMade) || paymentsMade < 0) {
    throw new RangeError('paymentsMade must be a non-negative finite number')
  }

  if (paymentsMade >= totalPayments) {
    return 0
  }

  if (monthlyRate === 0) {
    return principalDollars * (1 - paymentsMade / totalPayments)
  }

  const totalGrowth = (1 + monthlyRate) ** totalPayments
  const elapsedGrowth = (1 + monthlyRate) ** paymentsMade
  return principalDollars * (totalGrowth - elapsedGrowth) / (totalGrowth - 1)
}

function calculateHelocBalance(principalDollars, monthlyRate, monthsElapsed) {
  if (monthsElapsed <= HELOC_DRAW_MONTHS) {
    return principalDollars
  }

  return calculateRemainingBalance(
    principalDollars,
    monthlyRate,
    HELOC_REPAYMENT_MONTHS,
    monthsElapsed - HELOC_DRAW_MONTHS,
  )
}

function calculateHelocPayment(principalDollars, monthlyRate, monthsElapsed) {
  if (monthsElapsed < HELOC_DRAW_MONTHS) {
    return principalDollars * monthlyRate
  }

  return calculateMonthlyPayment(
    principalDollars,
    monthlyRate,
    HELOC_REPAYMENT_MONTHS,
  )
}

function calculateHelocCumulativePayments(
  principalDollars,
  monthlyRate,
  monthsElapsed,
) {
  const drawMonths = Math.min(monthsElapsed, HELOC_DRAW_MONTHS)
  const repaymentMonths = Math.min(
    Math.max(0, monthsElapsed - HELOC_DRAW_MONTHS),
    HELOC_REPAYMENT_MONTHS,
  )
  const drawInterest = principalDollars * monthlyRate * drawMonths
  const repaymentPayment = calculateMonthlyPayment(
    principalDollars,
    monthlyRate,
    HELOC_REPAYMENT_MONTHS,
  )

  return drawInterest + repaymentPayment * repaymentMonths
}

function createProjections({ cashNet, monthlyAt, equityAt, costAt }) {
  const years = [...PROJECTION_YEARS]
  const equity = years.map((year) => equityAt(year))

  return {
    years,
    cash: years.map((year, index) => roundCurrency((cashNet + equity[index]) / 1000)),
    equity: equity.map((value) => roundCurrency(value / 1000)),
    cumulativeCost: years.map((year) => roundCurrency(costAt(year) / 1000)),
    monthly: years.map((year) => roundCurrency(monthlyAt(year))),
  }
}

function createProductResult({
  id,
  eligible = true,
  keepTitle = true,
  cashNet,
  cashCost,
  monthlyAt,
  costAt,
  equityAt,
}) {
  if (!eligible) {
    return {
      id,
      eligible: false,
      keepTitle,
      cashNet: null,
      cashCost: null,
      monthly: null,
      costAt5Years: null,
      costAt10Years: null,
      equityAtYears: null,
      projections: null,
    }
  }

  const equityAtYears = PROJECTION_YEARS.map((year) => equityAt(year))

  return {
    id,
    eligible: true,
    keepTitle,
    cashNet,
    cashCost,
    monthly: roundCurrency(monthlyAt(0)),
    costAt5Years: roundCurrency(costAt(5)),
    costAt10Years: roundCurrency(costAt(10)),
    equityAtYears,
    projections: createProjections({
      cashNet,
      monthlyAt,
      equityAt,
      costAt,
    }),
  }
}

function buildHeloc({ homeValue, mortgageBalance, cashNeeded }) {
  const currentEquity = homeValue - mortgageBalance
  const closingCost = roundCurrency(Math.min(cashNeeded * 0.02, 3000))
  const monthlyRate = annualRateToMonthlyDecimal(HELOC_ANNUAL_RATE)

  return createProductResult({
    id: 'heloc',
    cashNet: Math.max(0, cashNeeded - closingCost),
    cashCost: closingCost,
    monthlyAt: (year) => -calculateHelocPayment(cashNeeded, monthlyRate, year * 12),
    costAt: (year) => closingCost + calculateHelocCumulativePayments(
      cashNeeded,
      monthlyRate,
      year * 12,
    ),
    equityAt: (year) => roundCurrency(
      currentEquity
        - calculateHelocBalance(cashNeeded, monthlyRate, year * 12)
        + homeValue * (HOME_GROWTH_FACTOR ** year - 1),
    ),
  })
}

function buildHeloan({ homeValue, mortgageBalance, cashNeeded }) {
  const currentEquity = homeValue - mortgageBalance
  const closingCost = roundCurrency(Math.min(cashNeeded * 0.025, 3500))
  const monthlyRate = annualRateToMonthlyDecimal(HELOAN_ANNUAL_RATE)
  const monthlyPayment = calculateMonthlyPayment(cashNeeded, monthlyRate, HELOAN_MONTHS)

  return createProductResult({
    id: 'heloan',
    cashNet: Math.max(0, cashNeeded - closingCost),
    cashCost: closingCost,
    monthlyAt: () => -monthlyPayment,
    costAt: (year) => closingCost + monthlyPayment * Math.min(year * 12, HELOAN_MONTHS),
    equityAt: (year) => roundCurrency(
      currentEquity
        - calculateRemainingBalance(cashNeeded, monthlyRate, HELOAN_MONTHS, year * 12)
        + homeValue * (HOME_GROWTH_FACTOR ** year - 1),
    ),
  })
}

function buildCashOutRefinance({
  homeValue,
  mortgageBalance,
  currentMortgageRateAnnualPercent,
  yearsRemaining,
  cashNeeded,
}) {
  const newLoanAmount = mortgageBalance + cashNeeded
  const refinanceMonthlyRate = annualRateToMonthlyDecimal(REFINANCE_ANNUAL_RATE)
  const refinancePayment = calculateMonthlyPayment(
    newLoanAmount,
    refinanceMonthlyRate,
    REFINANCE_MONTHS,
  )
  const oldMonthsRemaining = yearsRemaining * 12
  const oldMonthlyRate = annualRateToMonthlyDecimal(currentMortgageRateAnnualPercent)
  const oldPayment = calculateMonthlyPayment(
    mortgageBalance,
    oldMonthlyRate,
    oldMonthsRemaining,
  )
  const closingCost = roundCurrency(Math.min(newLoanAmount * 0.025, 8000))
  const monthlyDifference = refinancePayment - oldPayment

  return createProductResult({
    id: 'cash-out-refinance',
    cashNet: Math.max(0, cashNeeded - closingCost),
    cashCost: closingCost,
    monthlyAt: () => -monthlyDifference,
    costAt: (year) => Math.max(
      0,
      closingCost + monthlyDifference * Math.min(year * 12, REFINANCE_MONTHS),
    ),
    equityAt: (year) => roundCurrency(
      homeValue * HOME_GROWTH_FACTOR ** year
        - calculateRemainingBalance(
          newLoanAmount,
          refinanceMonthlyRate,
          REFINANCE_MONTHS,
          year * 12,
        ),
    ),
  })
}

function buildReverseMortgage({ homeValue, mortgageBalance, cashNeeded, age }) {
  const currentEquity = homeValue - mortgageBalance
  const eligible = age >= REVERSE_MINIMUM_AGE

  if (!eligible) {
    return createProductResult({ id: 'reverse-mortgage', eligible: false })
  }

  const principalLimitFactor = Math.min(0.6, 0.3 + (age - REVERSE_MINIMUM_AGE) * 0.015)
  const reverseAmount = Math.min(
    cashNeeded,
    Math.max(0, currentEquity) * principalLimitFactor * 0.95,
  )
  const closingCost = roundCurrency(reverseAmount * 0.04)

  return createProductResult({
    id: 'reverse-mortgage',
    cashNet: Math.max(0, reverseAmount - closingCost),
    cashCost: closingCost,
    monthlyAt: () => reverseAmount * 0.005,
    costAt: (year) => closingCost + reverseAmount * (REVERSE_GROWTH_FACTOR ** year - 1),
    equityAt: (year) => roundCurrency(
      currentEquity
        - reverseAmount * REVERSE_GROWTH_FACTOR ** year
        + homeValue * (HOME_GROWTH_FACTOR ** year - 1),
    ),
  })
}

function buildHomeEquityInvestment({ homeValue, mortgageBalance, cashNeeded }) {
  const cashCost = roundCurrency(cashNeeded * HEI_CASH_COST_RATE)

  return createProductResult({
    id: 'home-equity-investment',
    cashNet: Math.max(0, roundCurrency(cashNeeded * HEI_DISCOUNT) - cashCost),
    cashCost,
    monthlyAt: () => 0,
    costAt: (year) => cashCost
      + homeValue * HOME_GROWTH_FACTOR ** year * HEI_SHARE
      - homeValue * HEI_SHARE,
    equityAt: (year) => roundCurrency(
      homeValue * HOME_GROWTH_FACTOR ** year * (1 - HEI_SHARE) - mortgageBalance,
    ),
  })
}

function buildCoOwnership({ homeValue, mortgageBalance, cashNeeded }) {
  const ownershipShare = Math.min(cashNeeded / homeValue, MAX_CO_OWNERSHIP_SHARE)
  const cashCost = roundCurrency(cashNeeded * CO_OWNERSHIP_CASH_COST_RATE)

  return createProductResult({
    id: 'co-ownership',
    cashNet: Math.max(0, roundCurrency(cashNeeded * CO_OWNERSHIP_DISCOUNT) - cashCost),
    cashCost,
    monthlyAt: () => 0,
    costAt: (year) => cashCost
      + homeValue * HOME_GROWTH_FACTOR ** year * ownershipShare
      - homeValue * ownershipShare,
    equityAt: (year) => roundCurrency(
      homeValue * HOME_GROWTH_FACTOR ** year * (1 - ownershipShare) - mortgageBalance,
    ),
  })
}

function buildSaleLeaseback({ homeValue, mortgageBalance }) {
  const salePrice = roundCurrency(homeValue * SALE_LEASEBACK_PRICE_FACTOR)
  const rent = roundCurrency(homeValue * SALE_LEASEBACK_RENT_RATE)
  const cashCost = roundCurrency(homeValue * SALE_LEASEBACK_CASH_COST_RATE)

  return createProductResult({
    id: 'sale-leaseback',
    keepTitle: false,
    cashNet: Math.max(0, salePrice - mortgageBalance - cashCost),
    cashCost,
    monthlyAt: () => -rent,
    costAt: (year) => rent * year * 12,
    equityAt: () => 0,
  })
}

function buildProductResults(inputs) {
  return [
    buildHeloc(inputs),
    buildHeloan(inputs),
    buildCashOutRefinance(inputs),
    buildReverseMortgage(inputs),
    buildHomeEquityInvestment(inputs),
    buildCoOwnership(inputs),
    buildSaleLeaseback(inputs),
  ]
}

class MortgageCalculator {
  constructor(inputs = {}) {
    this.inputs = normalizeInputs(inputs)
    Object.freeze(this)
  }

  getInputs() {
    return { ...this.inputs }
  }

  getProducts() {
    return buildProductResults(this.inputs)
  }

  getRecommendations(answers) {
    return scoreProducts(this.getProducts(), answers)
  }
}

export {
  DEFAULT_INPUTS,
  MortgageCalculator,
  PRODUCT_IDS,
  PROJECTION_YEARS,
  calculateMonthlyPayment,
  calculateRemainingBalance,
  calculateHelocBalance,
  calculateHelocPayment,
}
