import { useState } from 'react'
import './Questionnaire.css'

const questionConfig = [
  {
    id: 'goal',
    progressLabel: 'Your priorities',
    title: 'What are you trying to accomplish?',
    description: 'Choose the outcome that is closest to what you need right now.',
    options: [
      { value: 'lump', label: 'Receive a lump sum', helper: 'Access cash for one-time needs or expenses.' },
      { value: 'income', label: 'Create monthly income', helper: 'Supplement ongoing income from home equity.' },
      { value: 'lower', label: 'Lower my monthly payment', helper: 'Reduce the amount leaving your budget each month.' },
      { value: 'faster', label: 'Pay off my mortgage faster', helper: 'Prioritize becoming mortgage-free sooner.' },
    ],
  },
  {
    id: 'stay',
    progressLabel: 'Time in home',
    title: 'How long do you plan to stay in your home?',
    description: 'This helps us prioritize options that fit your timeline.',
    options: [
      { value: 'yes', label: 'At least 10+ years' },
      { value: 'prob', label: 'Likely 5–10 years' },
      { value: 'open', label: 'I may move in the next few years' },
      { value: 'soon', label: 'I plan to move soon' },
    ],
  },
  {
    id: 'payment',
    progressLabel: 'Payment comfort',
    title: 'Can you comfortably handle an added payment?',
    description: 'Some options add a payment; others do not.',
    options: [
      { value: 'yes', label: 'Yes, a regular payment is fine' },
      { value: 'min', label: 'Only if it is small' },
      { value: 'no', label: 'No, I need to avoid extra monthly costs' },
    ],
  },
  {
    id: 'priority',
    progressLabel: 'Decision priority',
    title: 'Which priority matters most?',
    description: 'When tradeoffs arise, what matters most to you?',
    options: [
      { value: 'cost', label: 'Lowest total cost' },
      { value: 'cash', label: 'Maximum cash today' },
      { value: 'equity', label: 'Strongest long-term equity' },
      { value: 'simple', label: 'Simplicity and speed' },
    ],
  },
]

const emptyAnswers = {
  goal: '',
  stay: '',
  payment: '',
  priority: '',
}

function Questionnaire({
  onComplete,
  onBack,
  onStepChange,
  initialAnswers = emptyAnswers,
  initialStep = 1,
}) {
  const [answers, setAnswers] = useState(() => ({ ...emptyAnswers, ...initialAnswers }))
  const [currentStep, setCurrentStep] = useState(() => (
    Math.min(Math.max(Number(initialStep) - 1, 0), questionConfig.length - 1)
  ))
  const question = questionConfig[currentStep]
  const selectedValue = answers[question.id]
  const isComplete = Boolean(selectedValue)

  const progressLabel = `Step ${currentStep + 1} of 6 · ${question.progressLabel}`

  const handleChange = (value) => {
    setAnswers((current) => ({ ...current, [question.id]: value }))
  }

  const handleBack = () => {
    if (currentStep === 0) {
      onBack()
      return
    }

    onStepChange?.(currentStep)
    setCurrentStep((step) => step - 1)
  }

  const handleContinue = () => {
    if (!isComplete) {
      return
    }

    if (currentStep === questionConfig.length - 1) {
      onComplete(answers)
      return
    }

    onStepChange?.(currentStep + 2)
    setCurrentStep((step) => step + 1)
  }

  return (
    <section className="questionnaire" aria-labelledby="questionnaire-title">
      <div
        aria-label={progressLabel}
        aria-valuemax="6"
        aria-valuemin="1"
        aria-valuenow={currentStep + 1}
        aria-valuetext={progressLabel}
        className="questionnaire__top-progress"
        role="progressbar"
      >
        <div className="questionnaire__segments">
          {Array.from({ length: 6 }, (_, index) => (
            <span
              className={`questionnaire__segment ${index <= currentStep ? 'active' : ''}`}
              key={index}
            />
          ))}
        </div>
        <div className="questionnaire__top-meta">
          <p>Options to explore</p>
          <span>{progressLabel}</span>
        </div>
      </div>

      <div className="questionnaire__layout">
        <article className="questionnaire__panel">
          <header className="questionnaire__header">
            <p className="questionnaire__eyebrow">{progressLabel}</p>
            <h1 id="questionnaire-title">{question.title}</h1>
            <p className="questionnaire__description">{question.description}</p>
          </header>

          <fieldset className="questionnaire__group">
            <legend className="oro-visually-hidden">{question.title}</legend>
            <div className="questionnaire__options">
              {question.options.map((option) => {
                const isSelected = selectedValue === option.value

                return (
                  <label
                    className={`questionnaire__option ${isSelected ? 'selected' : ''}`}
                    key={option.value}
                  >
                    <input
                      checked={isSelected}
                      name={question.id}
                      onChange={() => handleChange(option.value)}
                      type="radio"
                      value={option.value}
                    />
                    <span className="questionnaire__option-mark" aria-hidden="true" />
                    <span className="questionnaire__option-content">
                      <strong>{option.label}</strong>
                      {option.helper && <small>{option.helper}</small>}
                    </span>
                  </label>
                )
              })}
            </div>
          </fieldset>

          <div className="questionnaire__actions">
            <button type="button" className="questionnaire__secondary" onClick={handleBack}>
              Back
            </button>
            <div className="questionnaire__primary-group">
              {!isComplete && (
                <p className="questionnaire__action-hint" role="note">
                  Select an option to continue.
                </p>
              )}
              <button
                type="button"
                className="questionnaire__primary"
                disabled={!isComplete}
                onClick={handleContinue}
              >
                {currentStep === questionConfig.length - 1 ? 'Continue to home details' : 'Continue'}
              </button>
            </div>
          </div>
        </article>

        <aside className="questionnaire__help-panel" aria-label="Why we ask">
          <h2>Why we ask</h2>
          <p>Your answers guide fit scoring. They do not change the financial calculations.</p>
          <div className="questionnaire__help-note" role="note">
            <span aria-hidden="true">i</span>
            <div>
              <strong>Scoring, not advice</strong>
              <p>Eligibility and home details are evaluated separately.</p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}

export default Questionnaire
