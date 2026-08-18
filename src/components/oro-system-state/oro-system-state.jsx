import './oro-system-state.css'

const stateTypes = new Set(['empty', 'loading', 'error'])
const markers = {
  empty: '—',
  loading: '◔',
  error: '!',
}

function OroSystemState({
  type = 'empty',
  title = 'Status message',
  body,
  children,
  className = '',
}) {
  const safeType = stateTypes.has(type) ? type : 'empty'
  const classes = [
    'oro-system-state',
    `oro-system-state--${safeType}`,
    className,
  ].filter(Boolean).join(' ')
  const content = children || body || 'Helpful recovery guidance.'

  return (
    <section
      className={classes}
      role={safeType === 'error' ? 'alert' : 'status'}
      aria-live={safeType === 'error' ? 'assertive' : 'polite'}
      aria-busy={safeType === 'loading' || undefined}
    >
      <span className="oro-system-state__marker" aria-hidden="true">
        {markers[safeType]}
      </span>
      <h2 className="oro-system-state__title">{title}</h2>
      <div className="oro-system-state__body">{content}</div>
    </section>
  )
}

export default OroSystemState
