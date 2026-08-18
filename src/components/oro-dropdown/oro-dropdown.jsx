import { useId } from 'react'
import { OroIcon } from '../oro-icon'
import './oro-dropdown.css'

function OroDropdown({
  id,
  label,
  value,
  defaultValue,
  onChange,
  options = [],
  placeholder = 'Select an option',
  helper,
  error,
  success,
  disabled = false,
  className = '',
  children,
  'aria-describedby': describedBy,
  'aria-invalid': invalid,
  ...selectProps
}) {
  const generatedId = useId()
  const selectId = id || generatedId
  const message = error || success || helper
  const messageId = message ? `${selectId}-message` : undefined
  const descriptionIds = [describedBy, messageId].filter(Boolean).join(' ') || undefined
  const selectedValue = value ?? defaultValue
  const hasValue = selectedValue !== undefined && String(selectedValue).length > 0
  const classes = [
    'oro-dropdown',
    hasValue && 'oro-dropdown--filled',
    error && 'oro-dropdown--error',
    !error && success && 'oro-dropdown--success',
    disabled && 'oro-dropdown--disabled',
    className,
  ].filter(Boolean).join(' ')

  return (
    <div className={classes}>
      <label className="oro-dropdown__label" htmlFor={selectId}>
        {label}
      </label>
      <span className="oro-dropdown__control">
        <select
          {...selectProps}
          className="oro-dropdown__select"
          id={selectId}
          value={value}
          defaultValue={defaultValue}
          disabled={disabled}
          onChange={onChange}
          aria-invalid={error ? true : invalid}
          aria-describedby={descriptionIds}
        >
          {placeholder && (
            <option value="" disabled={selectProps.required}>
              {placeholder}
            </option>
          )}
          {children || options.map((option) => (
            <option
              value={option.value}
              disabled={option.disabled}
              key={option.value}
            >
              {option.label}
            </option>
          ))}
        </select>
        <OroIcon className="oro-dropdown__icon" name="chevron-down" />
      </span>
      {message && (
        <span className="oro-dropdown__message" id={messageId}>
          {message}
        </span>
      )}
    </div>
  )
}

export default OroDropdown
