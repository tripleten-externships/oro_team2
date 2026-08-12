import { useId } from 'react'
import './oro-input-field.css'

const kinds = new Set(['text', 'currency', 'percentage', 'number'])

function OroInputField({
  id,
  label,
  kind = 'text',
  prefix,
  suffix,
  helper,
  error,
  success,
  disabled = false,
  className = '',
  'aria-describedby': describedBy,
  'aria-invalid': invalid,
  ...inputProps
}) {
  const generatedId = useId()
  const inputId = id || generatedId
  const safeKind = kinds.has(kind) ? kind : 'text'
  const message = error || success || helper
  const messageId = message ? `${inputId}-message` : undefined
  const descriptionIds = [describedBy, messageId].filter(Boolean).join(' ') || undefined
  const fieldValue = inputProps.value ?? inputProps.defaultValue
  const hasValue = fieldValue !== undefined && String(fieldValue).length > 0
  const resolvedPrefix = prefix ?? (safeKind === 'currency' ? '$' : undefined)
  const resolvedSuffix = suffix ?? (safeKind === 'percentage' ? '%' : undefined)
  const inputType = inputProps.type ?? (safeKind === 'number' ? 'number' : 'text')
  const inputMode = inputProps.inputMode
    ?? (['currency', 'percentage'].includes(safeKind) ? 'decimal' : undefined)
  const classes = [
    'oro-input-field',
    `oro-input-field--${safeKind}`,
    hasValue && 'oro-input-field--filled',
    error && 'oro-input-field--error',
    !error && success && 'oro-input-field--success',
    disabled && 'oro-input-field--disabled',
    className,
  ].filter(Boolean).join(' ')

  return (
    <div className={classes}>
      <label className="oro-input-field__label" htmlFor={inputId}>
        {label}
      </label>
      <span className="oro-input-field__control">
        {resolvedPrefix && (
          <span className="oro-input-field__affix">{resolvedPrefix}</span>
        )}
        <input
          {...inputProps}
          className="oro-input-field__input"
          id={inputId}
          type={inputType}
          inputMode={inputMode}
          disabled={disabled}
          aria-invalid={error ? true : invalid}
          aria-describedby={descriptionIds}
        />
        {resolvedSuffix && (
          <span className="oro-input-field__affix">{resolvedSuffix}</span>
        )}
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
