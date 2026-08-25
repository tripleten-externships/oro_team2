import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getFieldErrors,
  parseNumericInput,
  toParsedHomeDetailsValues,
} from './home-details-validation.js'

test('parses comma-formatted numeric strings', () => {
  assert.equal(parseNumericInput('350,000'), 350000)
  assert.equal(parseNumericInput('$320,000'), 320000)
  assert.equal(parseNumericInput('4.5'), 4.5)
})

test('accepts valid comma-formatted home and mortgage values', () => {
  const values = {
    homeValue: '350,000',
    mortgageBalance: '320,000',
    currentMortgageRateAnnualPercent: '4.5',
    yearsRemaining: '22',
    cashNeeded: '100,000',
    age: '55',
  }

  const parsed = toParsedHomeDetailsValues(values)
  const errors = getFieldErrors(values)

  assert.deepEqual(parsed, {
    homeValue: 350000,
    mortgageBalance: 320000,
    currentMortgageRateAnnualPercent: 4.5,
    yearsRemaining: 22,
    cashNeeded: 100000,
    age: 55,
  })
  assert.equal(errors.homeValue, undefined)
  assert.equal(errors.mortgageBalance, undefined)
})

test('flags mortgage balances above home value', () => {
  const errors = getFieldErrors({
    homeValue: '350,000',
    mortgageBalance: '360,000',
    currentMortgageRateAnnualPercent: '4.5',
    yearsRemaining: '22',
    cashNeeded: '100,000',
    age: '55',
  })

  assert.equal(
    errors.mortgageBalance,
    'Enter a mortgage balance greater than $0 and no higher than your home value.',
  )
})
