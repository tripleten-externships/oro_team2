import { MortgageCalculator } from '../domain/mortgage-calculator.js'

const PRODUCT_META = Object.freeze({
  heloc: {
    name: 'HELOC',
    description: 'Flexible borrowing with an illustrative interest-only draw period.',
    risk: 'The representative rate may change in a real HELOC and repayment payments can increase.',
  },
  heloan: {
    name: 'HELOAN',
    description: 'A fixed-rate lump sum with a predictable amortizing payment.',
    risk: 'The fixed payment continues until the modeled loan term is complete.',
  },
  'cash-out-refinance': {
    name: 'Cash-out refinance',
    description: 'Replace the current mortgage with a larger illustrative fixed-rate loan.',
    risk: 'A refinance can reset the repayment schedule and add long-term interest.',
  },
  'reverse-mortgage': {
    name: 'Reverse mortgage',
    description: 'An Oro estimate for accessing equity without a regular loan payment.',
    risk: 'The modeled balance grows over time and reduces future equity.',
  },
  'home-equity-investment': {
    name: 'Home equity investment',
    description: 'Receive cash today in exchange for a modeled share of future appreciation.',
    risk: 'The investor share can reduce future equity as the home value changes.',
  },
  'co-ownership': {
    name: 'Co-ownership',
    description: 'Share a modeled ownership interest in exchange for cash with no loan payment.',
    risk: 'The shared ownership interest can limit future control and equity growth.',
  },
  'sale-leaseback': {
    name: 'Sale leaseback',
    description: 'Sell the home, remain as a renter, and use modeled sale proceeds as cash.',
    risk: 'You no longer keep title or future home equity growth.',
  },
})

const EQUITY_YEARS = [0, 1, 2, 3, 5, 7, 10, 15, 20]

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

function formatCurrency(value) {
  return Number.isFinite(value) ? currencyFormatter.format(value) : '—'
}

function formatSignedCurrency(value) {
  if (!Number.isFinite(value)) {
    return '—'
  }

  if (value === 0) {
    return currencyFormatter.format(0)
  }

  const sign = value < 0 ? '-' : '+'
  return `${sign}${currencyFormatter.format(Math.abs(value))}`
}

function mapAnswersToDomain(answers) {
  return {
    goal: answers.goal,
    longTermStay: answers.stay,
    paymentCapacity: answers.payment,
    priority: answers.priority,
  }
}

function getEquityAtYear(product, year) {
  if (!Array.isArray(product.equityAtYears)) {
    return null
  }

  const index = EQUITY_YEARS.indexOf(year)
  return index >= 0 ? product.equityAtYears[index] : null
}

function getMonthlyLabel(monthly) {
  if (monthly > 0) {
    return 'Illustrative monthly income'
  }

  if (monthly < 0) {
    return 'Illustrative monthly payment'
  }

  return 'No required monthly payment'
}

function toViewProduct(product, score) {
  const metadata = PRODUCT_META[product.id]
  const unavailable = !product.eligible
  const monthlyLabel = unavailable ? 'Monthly impact' : getMonthlyLabel(product.monthly)

  return {
    ...product,
    name: metadata.name,
    description: metadata.description,
    risk: metadata.risk,
    score,
    ineligible: unavailable,
    equityAt5: getEquityAtYear(product, 5),
    equityAt10: getEquityAtYear(product, 10),
    equityAt15: getEquityAtYear(product, 15),
    monthlyLabel,
  }
}

function buildChartSeries(products) {
  const availableProducts = products.filter((product) => product.eligible)
  const seriesByView = {
    equity: availableProducts.map((product, index) => ({
      id: product.id,
      label: product.name,
      tone: ['primary', 'accent', 'neutral'][index % 3],
      points: product.projections.years.map((year, pointIndex) => ({
        x: year,
        y: product.projections.equity[pointIndex],
      })),
    })),
    'cumulative-cost': availableProducts.map((product, index) => ({
      id: product.id,
      label: product.name,
      tone: ['primary', 'accent', 'neutral'][index % 3],
      points: product.projections.years.map((year, pointIndex) => ({
        x: year,
        y: product.projections.cumulativeCost[pointIndex],
      })),
    })),
    'monthly-impact': availableProducts.map((product, index) => ({
      id: product.id,
      label: product.name,
      tone: ['primary', 'accent', 'neutral'][index % 3],
      value: product.projections.monthly[0],
    })),
  }

  return seriesByView
}

function getResults(inputs, answers, direct = false) {
  const calculator = new MortgageCalculator(inputs)
  const allProducts = calculator.getProducts().map((product) => toViewProduct(product))

  if (direct) {
    return {
      allProducts,
      direct: true,
      recommendations: allProducts.slice(0, 3),
      hasCloseMatch: false,
      seriesByView: buildChartSeries(allProducts),
    }
  }

  const recommendations = calculator
    .getRecommendations(mapAnswersToDomain(answers))
    .map(({ product, score }) => toViewProduct(product, score))

  const topScores = recommendations.slice(0, 2).map((product) => product.score)
  const hasCloseMatch = topScores.length === 2 && topScores[0] - topScores[1] <= 1

  return {
    allProducts,
    direct: false,
    recommendations,
    hasCloseMatch,
    seriesByView: buildChartSeries(allProducts),
  }
}

export {
  PRODUCT_META,
  buildChartSeries,
  formatCurrency,
  formatSignedCurrency,
  getResults,
  mapAnswersToDomain,
  toViewProduct,
}
