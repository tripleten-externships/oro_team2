import './oro-button.css'

const variants = new Set(['primary', 'secondary', 'tertiary', 'destructive'])

function Button({
  children,
  variant = 'primary',
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  ...props
}) {
  const safeVariant = variants.has(variant) ? variant : 'primary'
  const classes = [
    'oro-button',
    `oro-button--${safeVariant}`,
    className,
  ].filter(Boolean).join(' ')

  return (
    <button
      {...props}
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      {loading && <span className="oro-button__spinner" aria-hidden="true" />}
      <span>{children}</span>
    </button>
  )
}

export default Button
