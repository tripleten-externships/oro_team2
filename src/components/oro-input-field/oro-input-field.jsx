import { useId } from 'react'
import './oro-input-field.css'

function OroInputField({
  id,
  label,
  prefix,
  helper,
  error,
  disabled = false,
  className = '',
  'aria-describedby': describedBy,
  'aria-invalid': invalid,
  ...inputProps
}) {
  const generatedId = useId()
  const inputId = id || generatedId
  const message = error || helper
  const messageId = message ? `${inputId}-message` : undefined
  const descriptionIds = [describedBy, messageId].filter(Boolean).join(' ') || undefined
  const classes = [
    'oro-input-field',
    error && 'oro-input-field--error',
    disabled && 'oro-input-field--disabled',
    className,
  ].filter(Boolean).join(' ')

  return (
    <div className={classes}>
      <label className="oro-input-field__label" htmlFor={inputId}>
        {label}
      </label>
      <span className="oro-input-field__control">
        {prefix && <span className="oro-input-field__prefix">{prefix}</span>}
        <input
          {...inputProps}
          className="oro-input-field__input"
          id={inputId}
          disabled={disabled}
          aria-invalid={error ? true : invalid}
          aria-describedby={descriptionIds}
        />
      </span>
      {message && (
        <span className="oro-input-field__message" id={messageId}>
          {message}
        </span>
      )}
    </div>
  )
}

export default OroInputField
