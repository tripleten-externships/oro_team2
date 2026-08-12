import './oro-callout.css'

const calloutTypes = new Set(['info', 'warning', 'error', 'risk'])

function OroCallout({
  type = 'info',
  title,
  children,
  className = '',
  role,
}) {
  const safeType = calloutTypes.has(type) ? type : 'info'
  const classes = [
    'oro-callout',
    `oro-callout--${safeType}`,
    className,
  ].filter(Boolean).join(' ')

  return (
    <div className={classes} role={role || (safeType === 'error' ? 'alert' : undefined)}>
      <span className="oro-callout__marker" aria-hidden="true">
        {safeType === 'info' ? 'i' : '!'}
      </span>
      <div className="oro-callout__copy">
        {title && <strong className="oro-callout__title">{title}</strong>}
        {children && <div className="oro-callout__body">{children}</div>}
      </div>
    </div>
  )
}

export default OroCallout
