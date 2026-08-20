const mortgageBalanceError =
  'Enter a mortgage balance greater than $0 and no higher than your home value.'

function isBlank(value) {
  return value === undefined || String(value).trim() === ''
}

export function getFieldErrors(values) {
  const numbers = {
    homeValue: Number(values.homeValue),
    mortgageBalance: Number(values.mortgageBalance),
    currentMortgageRateAnnualPercent: Number(values.currentMortgageRateAnnualPercent),
    yearsRemaining: Number(values.yearsRemaining),
    cashNeeded: Number(values.cashNeeded),
    age: Number(values.age),
  }
  const errors = {}

  if (isBlank(values.homeValue)) {
    errors.homeValue = 'Enter a home value.'
  } else if (!Number.isFinite(numbers.homeValue) || numbers.homeValue <= 0) {
    errors.homeValue = 'Enter a home value greater than $0.'
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
  } else if (
    Number.isFinite(numbers.homeValue)
    && numbers.homeValue > 0
    && Number.isFinite(numbers.mortgageBalance)
    && numbers.mortgageBalance > 0
    && numbers.mortgageBalance <= numbers.homeValue
    && numbers.cashNeeded > numbers.homeValue - numbers.mortgageBalance
  ) {
    errors.cashNeeded = 'Cash needed cannot exceed your available equity (home value minus mortgage balance).'
  }

  if (isBlank(values.age)) {
    errors.age = 'Enter the youngest homeowner age.'
  } else if (!Number.isFinite(numbers.age) || numbers.age < 18 || numbers.age > 120) {
    errors.age = 'Enter an age between 18 and 120.'
  }

  return errors
}
