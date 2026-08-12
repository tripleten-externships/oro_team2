import './oro-button.css'
import loadingIndicator from '../../assets/icons/oro-button__loading-indicator.svg'
import loadingIndicatorInverse from '../../assets/icons/oro-button__loading-indicator-inverse.svg'

const variants = new Set(['primary', 'secondary', 'tertiary', 'destructive'])

function OroButton({
  children,
  variant = 'primary',
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  ...buttonProps
}) {
  const safeVariant = variants.has(variant) ? variant : 'primary'
  const spinner = safeVariant === 'destructive'
    ? loadingIndicatorInverse
    : loadingIndicator
  const classes = [
    'oro-button',
    `oro-button--${safeVariant}`,
    loading && 'oro-button--loading',
    className,
  ].filter(Boolean).join(' ')

  return (
    <button
      {...buttonProps}
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      {loading && (
        <img
          className="oro-button__spinner"
          src={spinner}
          alt=""
          aria-hidden="true"
        />
      )}
      <span className="oro-button__label">{children}</span>
    </button>
  )
}

export default OroButton
