import './oro-segment.css'

function OroSegment({
  label,
  selected = false,
  disabled = false,
  className = '',
  type = 'button',
  role,
  ...buttonProps
}) {
  const classes = [
    'oro-segment',
    selected && 'oro-segment--selected',
    className,
  ].filter(Boolean).join(' ')
  const selectionProps = role === 'tab'
    ? { 'aria-selected': selected, tabIndex: selected ? 0 : -1 }
    : { 'aria-pressed': selected }

  return (
    <button
      {...buttonProps}
      {...selectionProps}
      className={classes}
      type={type}
      role={role}
      disabled={disabled}
    >
      {label}
    </button>
  )
}

export default OroSegment
