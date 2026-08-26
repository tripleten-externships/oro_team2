import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getFieldErrors,
  getFieldWarnings,
  limitedEquityWarning,
  parseNumericFieldValue,
  parseNumericInput,
  toParsedHomeDetailsValues,
} from './home-details-validation.js'

const validValues = {
  homeValue: 750000,
  mortgageBalance: 350000,
  currentMortgageRateAnnualPercent: 4.5,
  yearsRemaining: 22,
  cashNeeded: 100000,
  age: 55,
}

test('accepts valid decimal, spaced, and zero-interest input values', () => {
  assert.deepEqual(getFieldErrors({
    ...validValues,
    homeValue: ' 750000.50 ',
    mortgageBalance: '350 000.25',
    currentMortgageRateAnnualPercent: ' 0 ',
    cashNeeded: '100 000.75',
  }), {})
  assert.equal(parseNumericFieldValue(' 750 000.50 '), 750000.5)
})

test('parses comma- and currency-formatted numeric strings', () => {
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

  assert.deepEqual(toParsedHomeDetailsValues(values), {
    homeValue: 350000,
    mortgageBalance: 320000,
    currentMortgageRateAnnualPercent: 4.5,
    yearsRemaining: 22,
    cashNeeded: 100000,
    age: 55,
  })
  assert.deepEqual(getFieldErrors(values), {})
})

test('requires a positive mortgage balance no higher than home value', () => {
  assert.equal(
    getFieldErrors({ ...validValues, mortgageBalance: 0 }).mortgageBalance,
    'Enter a mortgage balance greater than $0 and no higher than your home value.',
  )
  assert.equal(
    getFieldErrors({ ...validValues, mortgageBalance: 800000 }).mortgageBalance,
    'Enter a mortgage balance greater than $0 and no higher than your home value.',
  )
  assert.equal(getFieldErrors({ ...validValues, mortgageBalance: 750000 }).mortgageBalance, undefined)
})

test('warns when cash needed exceeds available equity without blocking review', () => {
  assert.equal(getFieldErrors({ ...validValues, cashNeeded: 400000 }).cashNeeded, undefined)
  assert.equal(
    getFieldWarnings({ ...validValues, cashNeeded: 400001 }).cashNeeded,
    limitedEquityWarning,
  )
})

test('caps home value before it reaches the calculation model', () => {
  assert.match(
    getFieldErrors({ ...validValues, homeValue: 100000001 }).homeValue,
    /no higher than \$100,000,000/,
  )
})

test('clears cross-field errors when the corrected values are submitted', () => {
  assert.deepEqual(getFieldErrors({
    ...validValues,
    mortgageBalance: 300000,
    cashNeeded: 450000,
  }), {})
  assert.deepEqual(getFieldWarnings({
    ...validValues,
    mortgageBalance: 300000,
    cashNeeded: 450001,
  }), { cashNeeded: limitedEquityWarning })
  assert.deepEqual(getFieldWarnings({
    ...validValues,
    homeValue: 900000,
    mortgageBalance: 300000,
    cashNeeded: 450000,
  }), {})
})

test('flags mortgage balances above home value with formatted inputs', () => {
  const errors = getFieldErrors({
    ...validValues,
    homeValue: '350,000',
    mortgageBalance: '360,000',
    cashNeeded: '100,000',
  })

  assert.equal(
    errors.mortgageBalance,
    'Enter a mortgage balance greater than $0 and no higher than your home value.',
  )
})
