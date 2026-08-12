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
  yearsRemaining: { minimum: 0 },
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
const HELOAN_ANNUAL_RATE = 8
const HELOAN_MONTHS = 15 * 12
const REVERSE_ANNUAL_RATE = 7.5
const REVERSE_GROWTH_FACTOR = 1 + REVERSE_ANNUAL_RATE / 100
const REVERSE_MINIMUM_AGE = 62
const HEI_SHARE = 0.15
const HEI_DISCOUNT = 0.88
const CO_OWNERSHIP_DISCOUNT = 0.9
const MAX_CO_OWNERSHIP_SHARE = 0.49
const SALE_LEASEBACK_PRICE_FACTOR = 0.875

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

function createProjections({ cashNet, cashCost, monthly, equityAt }) {
  const years = [...PROJECTION_YEARS]
  const equity = years.map((year) => equityAt(year))

  return {
    years,
    cash: years.map((year, index) => roundCurrency((cashNet + equity[index]) / 1000)),
    equity: equity.map((value) => Math.max(0, roundCurrency(value / 1000))),
    cumulativeCost: years.map((year) => roundCurrency(
      (Math.abs(monthly) * year * 12 + cashCost) / 1000,
    )),
    monthly: years.map(() => roundCurrency(Math.abs(monthly))),
  }
}

function createProductResult({
  id,
  eligible = true,
  keepTitle = true,
  cashNet,
  cashCost,
  monthly,
  cost10,
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
    monthly,
    costAt5Years: roundCurrency(cost10 / 2),
    costAt10Years: cost10,
    equityAtYears,
    projections: createProjections({ cashNet, cashCost, monthly, equityAt }),
  }
}

function buildHeloc({ homeValue, mortgageBalance, cashNeeded }) {
  const currentEquity = homeValue - mortgageBalance
  const closingCost = roundCurrency(Math.min(cashNeeded * 0.02, 3000))
  const monthlyInterest = cashNeeded * annualRateToMonthlyDecimal(HELOC_ANNUAL_RATE)

  return createProductResult({
    id: 'heloc',
    cashNet: cashNeeded - closingCost,
    cashCost: closingCost,
    monthly: -roundCurrency(monthlyInterest),
    cost10: roundCurrency(monthlyInterest * 120 + closingCost),
    equityAt: (year) => roundCurrency(
      currentEquity
        - cashNeeded * Math.max(0, 1 - year / 15)
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
    cashNet: cashNeeded - closingCost,
    cashCost: closingCost,
    monthly: -roundCurrency(monthlyPayment),
    cost10: roundCurrency(monthlyPayment * 120 + closingCost),
    equityAt: (year) => roundCurrency(
      currentEquity
        - cashNeeded * Math.max(0, 1 - year / 15)
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
  const oldPayment = oldMonthsRemaining > 0
    ? calculateMonthlyPayment(mortgageBalance, oldMonthlyRate, oldMonthsRemaining)
    : 0
  const closingCost = roundCurrency(Math.min(newLoanAmount * 0.025, 8000))
  const monthlyImpact = -roundCurrency(refinancePayment - oldPayment)

  return createProductResult({
    id: 'cash-out-refinance',
    cashNet: cashNeeded - closingCost,
    cashCost: closingCost,
    monthly: monthlyImpact,
    cost10: roundCurrency((refinancePayment - oldPayment) * 120 + closingCost),
    equityAt: (year) => {
      const remainingBalance = newLoanAmount * (
        (1 + refinanceMonthlyRate) ** REFINANCE_MONTHS
        - (1 + refinanceMonthlyRate) ** (12 * year)
      ) / ((1 + refinanceMonthlyRate) ** REFINANCE_MONTHS - 1)

      return roundCurrency(homeValue * HOME_GROWTH_FACTOR ** year - remainingBalance)
    },
  })
}

function buildReverseMortgage({ homeValue, mortgageBalance, cashNeeded, age }) {
  const currentEquity = homeValue - mortgageBalance
  const eligible = age >= REVERSE_MINIMUM_AGE

  if (!eligible) {
    return createProductResult({ id: 'reverse-mortgage', eligible: false })
  }

  const principalLimitFactor = Math.min(0.6, 0.3 + (age - REVERSE_MINIMUM_AGE) * 0.015)
  const reverseAmount = Math.max(
    0,
    Math.min(cashNeeded, currentEquity * principalLimitFactor * 0.95),
  )
  const closingCost = roundCurrency(reverseAmount * 0.04)

  return createProductResult({
    id: 'reverse-mortgage',
    cashNet: Math.min(reverseAmount, cashNeeded) - closingCost,
    cashCost: closingCost,
    monthly: roundCurrency(reverseAmount * 0.005),
    cost10: roundCurrency(reverseAmount * (REVERSE_GROWTH_FACTOR ** 10 - 1)),
    equityAt: (year) => Math.max(0, roundCurrency(
      currentEquity
        - reverseAmount * REVERSE_GROWTH_FACTOR ** year
        + homeValue * (HOME_GROWTH_FACTOR ** year - 1),
    )),
  })
}

function buildHomeEquityInvestment({ homeValue, mortgageBalance, cashNeeded }) {
  return createProductResult({
    id: 'home-equity-investment',
    cashNet: roundCurrency(cashNeeded * HEI_DISCOUNT),
    cashCost: roundCurrency(cashNeeded * 0.03),
    monthly: 0,
    cost10: roundCurrency(
      homeValue * HOME_GROWTH_FACTOR ** 10 * HEI_SHARE - homeValue * HEI_SHARE,
    ),
    equityAt: (year) => roundCurrency(
      homeValue * HOME_GROWTH_FACTOR ** year * (1 - HEI_SHARE) - mortgageBalance,
    ),
  })
}

function buildCoOwnership({ homeValue, mortgageBalance, cashNeeded }) {
  const ownershipShare = Math.min(cashNeeded / homeValue, MAX_CO_OWNERSHIP_SHARE)

  return createProductResult({
    id: 'co-ownership',
    cashNet: roundCurrency(cashNeeded * CO_OWNERSHIP_DISCOUNT),
    cashCost: roundCurrency(cashNeeded * 0.02),
    monthly: 0,
    cost10: roundCurrency(
      homeValue * HOME_GROWTH_FACTOR ** 10 * ownershipShare
        - homeValue * ownershipShare,
    ),
    equityAt: (year) => roundCurrency(
      homeValue * HOME_GROWTH_FACTOR ** year * (1 - ownershipShare) - mortgageBalance,
    ),
  })
}

function buildSaleLeaseback({ homeValue, mortgageBalance }) {
  const salePrice = roundCurrency(homeValue * SALE_LEASEBACK_PRICE_FACTOR)
  const rent = roundCurrency(homeValue * 0.005)
  const cashCost = roundCurrency(homeValue * 0.02)

  return createProductResult({
    id: 'sale-leaseback',
    keepTitle: false,
    cashNet: salePrice - mortgageBalance - cashCost,
    cashCost,
    monthly: -rent,
    cost10: roundCurrency(rent * 120),
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
  MortgageCalculator,
  PRODUCT_IDS,
  PROJECTION_YEARS,
  calculateMonthlyPayment,
}
