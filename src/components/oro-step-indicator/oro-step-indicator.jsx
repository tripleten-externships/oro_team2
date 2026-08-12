import './oro-step-indicator.css'

const defaultLabels = [
  'Question 1',
  'Question 2',
  'Question 3',
  'Question 4',
  'Home details',
  'Matched options',
]

function OroStepIndicator({ currentStep = 1, totalSteps = 6, label, className = '' }) {
  const safeTotal = Number.isInteger(totalSteps) && totalSteps > 0 ? totalSteps : 6
  const safeCurrent = Number.isInteger(currentStep)
    ? Math.min(Math.max(currentStep, 1), safeTotal)
    : 1
  const currentLabel = label || defaultLabels[safeCurrent - 1] || `Step ${safeCurrent}`
  const classes = ['oro-step-indicator', className].filter(Boolean).join(' ')

  return (
    <div
      className={classes}
      role="progressbar"
      aria-valuemin="1"
      aria-valuemax={safeTotal}
      aria-valuenow={safeCurrent}
      aria-valuetext={`${safeCurrent} of ${safeTotal}: ${currentLabel}`}
    >
      <div className="oro-step-indicator__segments" aria-hidden="true">
        {Array.from({ length: safeTotal }, (_, index) => (
          <span
            className={[
              'oro-step-indicator__segment',
              index < safeCurrent && 'oro-step-indicator__segment--active',
            ].filter(Boolean).join(' ')}
            key={index}
          />
        ))}
      </div>
      <p className="oro-step-indicator__label">
        <span>{safeCurrent} of {safeTotal}</span>
        <span aria-hidden="true"> · </span>
        <span>{currentLabel}</span>
      </p>
    </div>
  )
}

export default OroStepIndicator
