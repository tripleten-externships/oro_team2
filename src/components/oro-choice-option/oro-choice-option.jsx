import { useId } from 'react'
import './oro-choice-option.css'

const choiceTypes = new Set(['radio', 'checkbox'])

function OroChoiceOption({
  id,
  name,
  value,
  type = 'radio',
  label,
  helper,
  checked = false,
  disabled = false,
  className = '',
  onChange,
  ...inputProps
}) {
  const generatedId = useId()
  const inputId = id || generatedId
  const safeType = choiceTypes.has(type) ? type : 'radio'
  const classes = [
    'oro-choice-option',
    `oro-choice-option--${safeType}`,
    checked && 'oro-choice-option--selected',
    disabled && 'oro-choice-option--disabled',
    className,
  ].filter(Boolean).join(' ')

  return (
    <label className={classes} htmlFor={inputId}>
      <input
        {...inputProps}
        className="oro-choice-option__input oro-visually-hidden"
        id={inputId}
        type={safeType}
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
      />
      <span className="oro-choice-option__marker" aria-hidden="true">
        {checked && safeType === 'radio' && (
          <span className="oro-choice-option__selected-dot" />
        )}
        {checked && safeType === 'checkbox' && (
          <span className="oro-choice-option__check">✓</span>
        )}
      </span>
      <span className="oro-choice-option__copy">
        <span className="oro-choice-option__label">{label}</span>
        {helper && <span className="oro-choice-option__helper">{helper}</span>}
      </span>
    </label>
  )
}

export default OroChoiceOption
