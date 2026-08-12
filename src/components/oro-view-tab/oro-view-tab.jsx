import './oro-view-tab.css'

function OroViewTab({
  id,
  controls,
  label,
  selected = false,
  className = '',
  onClick,
  ...buttonProps
}) {
  const classes = [
    'oro-view-tab',
    selected && 'oro-view-tab--selected',
    className,
  ].filter(Boolean).join(' ')

  return (
    <button
      {...buttonProps}
      className={classes}
      id={id}
      type="button"
      role="tab"
      aria-controls={controls}
      aria-selected={selected}
      tabIndex={selected ? 0 : -1}
      onClick={onClick}
    >
      {label}
    </button>
  )
}

export default OroViewTab
