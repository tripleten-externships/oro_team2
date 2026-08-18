import loadingIndicator from '../../assets/icons/oro-button__loading-indicator.svg'
import { OroIcon } from '../oro-icon'
import './oro-icon-button.css'

function OroIconButton({
  icon = 'info',
  label = 'More information',
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  'aria-label': ariaLabel,
  ...buttonProps
}) {
  const classes = [
    'oro-icon-button',
    loading && 'oro-icon-button--loading',
    className,
  ].filter(Boolean).join(' ')

  return (
    <button
      {...buttonProps}
      className={classes}
      type={type}
      disabled={disabled || loading}
      aria-label={ariaLabel || label}
      aria-busy={loading || undefined}
    >
      {loading ? (
        <img
          className="oro-icon-button__spinner"
          src={loadingIndicator}
          alt=""
          aria-hidden="true"
        />
      ) : typeof icon === 'string' ? (
        <OroIcon name={icon} />
      ) : (
        icon
      )}
    </button>
  )
}

export default OroIconButton
