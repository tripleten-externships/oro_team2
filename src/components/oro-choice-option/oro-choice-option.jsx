import { useId } from 'react'
import selectionMarker from '../../assets/icons/oro-choice-option__selection-marker.svg'
import './oro-choice-option.css'

function OroChoiceOption({
  id,
  name,
  value,
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
  const classes = [
    'oro-choice-option',
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
        type="radio"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
      />
      <span className="oro-choice-option__marker" aria-hidden="true">
        {checked && (
          <img
            className="oro-choice-option__marker-image"
            src={selectionMarker}
            alt=""
          />
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
