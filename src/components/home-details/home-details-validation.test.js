import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getFieldErrors,
  getFieldWarnings,
  limitedEquityWarning,
  parseNumericFieldValue,
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
