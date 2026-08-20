import assert from 'node:assert/strict'
import test from 'node:test'
import { getFieldErrors } from './home-details-validation.js'

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
    mortgageBalance: '350000.25',
    currentMortgageRateAnnualPercent: '0',
    cashNeeded: '100000.75',
  }), {})
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

test('reports cash needed above available equity on the cash field', () => {
  assert.equal(getFieldErrors({ ...validValues, cashNeeded: 400000 }).cashNeeded, undefined)
  assert.equal(
    getFieldErrors({ ...validValues, cashNeeded: 400001 }).cashNeeded,
    'Cash needed cannot exceed your available equity (home value minus mortgage balance).',
  )
})

test('clears cross-field errors when the corrected values are submitted', () => {
  assert.deepEqual(getFieldErrors({
    ...validValues,
    mortgageBalance: 300000,
    cashNeeded: 450000,
  }), {})
  assert.deepEqual(getFieldErrors({
    ...validValues,
    homeValue: 900000,
    mortgageBalance: 300000,
    cashNeeded: 450000,
  }), {})
})
