import { useState } from 'react'
import { DEFAULT_INPUTS } from '../../domain/mortgage-calculator.js'
import { OroButton } from '../oro-button'
import { OroCallout } from '../oro-callout'
import { OroInputField } from '../oro-input-field'
import { OroStepIndicator } from '../oro-step-indicator'
import {
  getFieldErrors,
  getFieldWarnings,
  parseNumericFieldValue,
  toParsedHomeDetailsValues,
} from './home-details-validation.js'
import './home-details.css'

const fieldConfig = [
  {
    id: 'homeValue',
    label: 'Estimated home value',
    kind: 'currency',
    placeholder: '750,000',
    helper: 'Use a recent estimate or appraisal if you have one.',
    inputMode: 'decimal',
  },
  {
    id: 'mortgageBalance',
    label: 'Current mortgage balance',
    kind: 'currency',
    placeholder: '350,000',
    helper: 'An approximate remaining balance is okay.',
    inputMode: 'decimal',
  },
  {
    id: 'currentMortgageRateAnnualPercent',
    label: 'Current mortgage rate',
    kind: 'percentage',
    placeholder: '4.5',
    helper: 'Enter 0 if your current loan has no interest rate.',
    inputMode: 'decimal',
  },
  {
    id: 'yearsRemaining',
    label: 'Years remaining on mortgage',
    kind: 'number',
    placeholder: '22',
    helper: 'Use the remaining term, not the original loan term.',
    inputMode: 'numeric',
  },
  {
    id: 'cashNeeded',
    label: 'Cash you want to access',
    kind: 'currency',
    placeholder: '100,000',
    helper: 'This is the amount you would like to receive before product costs.',
    inputMode: 'decimal',
  },
  {
    id: 'age',
    label: 'Age of the youngest homeowner',
    kind: 'number',
    placeholder: '55',
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

function HomeDetails({ initialValues = DEFAULT_INPUTS, onSubmit, onBack }) {
  const [values, setValues] = useState(() => toFormValues(initialValues))
  const [submitted, setSubmitted] = useState(false)
  const errors = submitted ? getFieldErrors(values) : {}
  const warnings = getFieldWarnings(values)
  const showLimitedOptionsAction = Boolean(warnings.cashNeeded && Object.keys(errors).length === 0)

  function handleChange(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
  }

  function handleBlur(event) {
    const field = fieldConfig.find((item) => item.id === event.target.name)
    if (!field || !['currency', 'percentage'].includes(field.kind)) {
      return
    }

    const normalizedValue = event.target.value.replace(/\s+/g, '')
    if (normalizedValue !== event.target.value) {
      setValues((current) => ({ ...current, [field.id]: normalizedValue }))
    }
  }

  function handleSubmit(event) {
    event.preventDefault()
    setSubmitted(true)
    const nextErrors = getFieldErrors(values)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    onSubmit(toParsedHomeDetailsValues(values))
  }

  function focusField(fieldId) {
    document.getElementById(fieldId)?.focus()
  }

  return (
    <main className="home-details" aria-labelledby="home-details-title">
      <OroStepIndicator
        className="home-details__progress"
        currentStep={5}
        label="Home details"
      />
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
            <OroCallout type="error" title="Check these fields" role="alert">
              <ul className="home-details__validation-list">
                {fieldConfig
                  .filter((field) => errors[field.id])
                  .map((field) => (
                    <li key={field.id}>
                      <button
                        className="home-details__validation-link"
                        type="button"
                        onClick={() => focusField(field.id)}
                      >
                        {field.label}: {errors[field.id]}
                      </button>
                    </li>
                  ))}
              </ul>
            </OroCallout>
          )}

          {warnings.cashNeeded && (
            <OroCallout
              role="status"
              type="error"
              title="Cash requested exceeds estimated available equity"
            >
              {warnings.cashNeeded}
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
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values[field.id]}
                />
              ))}
            </div>

            <div className="home-details__actions">
              <OroButton variant="secondary" onClick={onBack}>Back</OroButton>
              <OroButton type="submit">
                {showLimitedOptionsAction ? 'Review Limited Options' : 'See my options'}
              </OroButton>
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
