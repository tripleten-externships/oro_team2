import { useState } from 'react'
import { DEFAULT_INPUTS } from '../../domain/mortgage-calculator.js'
import { OroButton } from '../oro-button'
import { OroCallout } from '../oro-callout'
import { OroInputField } from '../oro-input-field'
import './home-details.css'

const fieldConfig = [
  {
    id: 'homeValue',
    label: 'Estimated home value',
    kind: 'currency',
    helper: 'Use a recent estimate or appraisal if you have one.',
    inputMode: 'decimal',
  },
  {
    id: 'mortgageBalance',
    label: 'Current mortgage balance',
    kind: 'currency',
    helper: 'An approximate remaining balance is okay.',
    inputMode: 'decimal',
  },
  {
    id: 'currentMortgageRateAnnualPercent',
    label: 'Current mortgage rate',
    kind: 'percentage',
    helper: 'Enter 0 if your current loan has no interest rate.',
    inputMode: 'decimal',
  },
  {
    id: 'yearsRemaining',
    label: 'Years remaining on mortgage',
    kind: 'number',
    helper: 'Use the remaining term, not the original loan term.',
    inputMode: 'numeric',
  },
  {
    id: 'cashNeeded',
    label: 'Cash you want to access',
    kind: 'currency',
    helper: 'This is the amount you would like to receive before product costs.',
    inputMode: 'decimal',
  },
  {
    id: 'age',
    label: 'Age of the youngest homeowner',
    kind: 'number',
    helper: 'This only affects the illustrative reverse mortgage estimate.',
    inputMode: 'numeric',
  },
]

function toFormValues(values) {
  return fieldConfig.reduce((formValues, field) => {
    formValues[field.id] = values[field.id] ?? ''
    return formValues
  }, {})
}

function isBlank(value) {
  return value === undefined || String(value).trim() === ''
}

function getFieldErrors(values) {
  const numbers = Object.fromEntries(
    fieldConfig.map((field) => [field.id, Number(values[field.id])]),
  )
  const errors = {}

  if (isBlank(values.homeValue)) {
    errors.homeValue = 'Enter a home value.'
  } else if (!Number.isFinite(numbers.homeValue) || numbers.homeValue <= 0) {
    errors.homeValue = 'Enter a home value greater than $0.'
  }

  if (isBlank(values.mortgageBalance)) {
    errors.mortgageBalance = 'Enter your current mortgage balance.'
  } else if (!Number.isFinite(numbers.mortgageBalance) || numbers.mortgageBalance < 0) {
    errors.mortgageBalance = 'Enter a mortgage balance of $0 or more.'
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

function HomeDetails({ initialValues = DEFAULT_INPUTS, onSubmit, onBack }) {
  const [values, setValues] = useState(() => toFormValues(initialValues))
  const [submitted, setSubmitted] = useState(false)
  const errors = submitted ? getFieldErrors(values) : {}

  function handleChange(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    setSubmitted(true)
    const nextErrors = getFieldErrors(values)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    onSubmit(Object.fromEntries(
      fieldConfig.map((field) => [field.id, Number(values[field.id])]),
    ))
  }

  return (
    <main className="home-details" aria-labelledby="home-details-title">
      <div className="home-details__layout">
        <section className="home-details__panel">
          <header className="home-details__header">
            <p className="home-details__eyebrow">Home details</p>
            <h1 id="home-details-title">Let&apos;s make the comparison personal</h1>
            <p>
              A few numbers help us estimate cash, monthly impact, costs, and
              future equity for each option.
            </p>
          </header>

          {submitted && Object.keys(errors).length > 0 && (
            <OroCallout type="error" title="Check the highlighted details" role="alert">
              Every field needs a valid value before we can show the comparison.
            </OroCallout>
          )}

          <form className="home-details__form" onSubmit={handleSubmit} noValidate>
            <div className="home-details__fields">
              {fieldConfig.map((field) => (
                <OroInputField
                  {...field}
                  error={errors[field.id]}
                  id={field.id}
                  key={field.id}
                  name={field.id}
                  onChange={handleChange}
                  value={values[field.id]}
                />
              ))}
            </div>

            <div className="home-details__actions">
              <OroButton variant="secondary" onClick={onBack}>Back</OroButton>
              <OroButton type="submit">See my options</OroButton>
            </div>
          </form>
        </section>

        <aside className="home-details__aside" aria-label="About your information">
          <h2>Private by design</h2>
          <p>
            Your entries are saved on this device so you can revisit the flow.
            They are not sent to a server by this prototype.
          </p>
          <OroCallout type="info" title="Illustrative estimates">
            Results use Oro&apos;s documented assumptions. They are not a quote,
            APR, underwriting decision, or financial advice.
          </OroCallout>
        </aside>
      </div>
    </main>
  )
}

export default HomeDetails
