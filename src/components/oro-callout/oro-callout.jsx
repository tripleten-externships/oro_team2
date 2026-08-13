import './oro-callout.css'

const calloutTypes = new Set([
  'info',
  'neutral',
  'success',
  'warning',
  'error',
  'risk',
])

const markers = {
  info: 'i',
  neutral: '?',
  success: '✓',
  warning: '!',
  error: '×',
  risk: '!',
}

function OroCallout({
  type = 'info',
  title,
  children,
  showMarker = true,
  surface = 'tinted',
  className = '',
  role,
}) {
  const safeType = calloutTypes.has(type) ? type : 'info'
  const classes = [
    'oro-callout',
    `oro-callout--${safeType}`,
    surface === 'card' && 'oro-callout--card',
    className,
  ].filter(Boolean).join(' ')

  return (
    <div className={classes} role={role || (safeType === 'error' ? 'alert' : undefined)}>
      {showMarker && (
        <span className="oro-callout__marker" aria-hidden="true">
          {markers[safeType]}
        </span>
      )}
      <div className="oro-callout__copy">
        {title && <strong className="oro-callout__title">{title}</strong>}
        {children && <div className="oro-callout__body">{children}</div>}
      </div>
    </div>
  )
}

export default OroCallout
