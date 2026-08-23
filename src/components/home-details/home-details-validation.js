import { MAX_HOME_VALUE } from '../../domain/mortgage-calculator.js'

const mortgageBalanceError =
  'Enter a mortgage balance greater than $0 and no higher than your home value.'
const limitedEquityWarning =
  'Lower the amount or revise the home value and mortgage balance. Actual availability may be lower after costs and provider limits.'
const maximumHomeValueError = `Enter a home value no higher than $${MAX_HOME_VALUE.toLocaleString('en-US')}.`

function isBlank(value) {
  return value === undefined || String(value).trim() === ''
}

export function parseNumericFieldValue(value) {
  if (value === undefined || value === null) {
    return Number.NaN
  }

  return Number(String(value).replace(/\s+/g, ''))
}

export function getFieldErrors(values) {
  const numbers = {
    homeValue: parseNumericFieldValue(values.homeValue),
    mortgageBalance: parseNumericFieldValue(values.mortgageBalance),
    currentMortgageRateAnnualPercent: parseNumericFieldValue(values.currentMortgageRateAnnualPercent),
    yearsRemaining: parseNumericFieldValue(values.yearsRemaining),
    cashNeeded: parseNumericFieldValue(values.cashNeeded),
    age: parseNumericFieldValue(values.age),
  }
  const errors = {}

  if (isBlank(values.homeValue)) {
    errors.homeValue = 'Enter a home value.'
  } else if (!Number.isFinite(numbers.homeValue) || numbers.homeValue <= 0) {
    errors.homeValue = 'Enter a home value greater than $0.'
  } else if (numbers.homeValue > MAX_HOME_VALUE) {
    errors.homeValue = maximumHomeValueError
  }

  if (isBlank(values.mortgageBalance)) {
    errors.mortgageBalance = 'Enter your current mortgage balance.'
  } else if (
    !Number.isFinite(numbers.mortgageBalance)
    || numbers.mortgageBalance <= 0
    || (
      Number.isFinite(numbers.homeValue)
      && numbers.homeValue > 0
      && numbers.mortgageBalance > numbers.homeValue
    )
  ) {
    errors.mortgageBalance = mortgageBalanceError
  }

  if (isBlank(values.currentMortgageRateAnnualPercent)) {
    errors.currentMortgageRateAnnualPercent = 'Enter your current mortgage rate.'
  } else if (
    !Number.isFinite(numbers.currentMortgageRateAnnualPercent)
    || numbers.currentMortgageRateAnnualPercent < 0
    || numbers.currentMortgageRateAnnualPercent > 100
  ) {
    errors.currentMortgageRateAnnualPercent = 'Enter a rate between 0% and 100%.'
  }

  if (isBlank(values.yearsRemaining)) {
    errors.yearsRemaining = 'Enter the years remaining on your mortgage.'
  } else if (!Number.isFinite(numbers.yearsRemaining) || numbers.yearsRemaining <= 0) {
    errors.yearsRemaining = 'Enter at least 1 year remaining.'
  }

  if (isBlank(values.cashNeeded)) {
    errors.cashNeeded = 'Enter the cash amount you want to access.'
  } else if (!Number.isFinite(numbers.cashNeeded) || numbers.cashNeeded < 0) {
    errors.cashNeeded = 'Enter a cash amount of $0 or more.'
  }

  if (isBlank(values.age)) {
    errors.age = 'Enter the youngest homeowner age.'
  } else if (!Number.isFinite(numbers.age) || numbers.age < 18 || numbers.age > 120) {
    errors.age = 'Enter an age between 18 and 120.'
  }

  return errors
}

export function getFieldWarnings(values) {
  const homeValue = parseNumericFieldValue(values.homeValue)
  const mortgageBalance = parseNumericFieldValue(values.mortgageBalance)
  const cashNeeded = parseNumericFieldValue(values.cashNeeded)

  if (
    Number.isFinite(homeValue)
    && homeValue > 0
    && homeValue <= MAX_HOME_VALUE
    && Number.isFinite(mortgageBalance)
    && mortgageBalance > 0
    && mortgageBalance <= homeValue
    && Number.isFinite(cashNeeded)
    && cashNeeded >= 0
    && cashNeeded > homeValue - mortgageBalance
  ) {
    return { cashNeeded: limitedEquityWarning }
  }

  return {}
}

export { limitedEquityWarning }
