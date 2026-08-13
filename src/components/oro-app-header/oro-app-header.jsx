import { OroButton } from '../oro-button'
import './oro-app-header.css'

function OroAppHeader({
  context,
  productLabel = 'Home equity explorer',
  notice = 'Illustrative estimates · Educational only · Inputs stay on this device',
  restartLabel = 'Restart',
  onRestart,
  className = '',
}) {
  const classes = ['oro-app-header', className].filter(Boolean).join(' ')
  const showContext = Boolean(context && context !== productLabel)

  return (
    <header className={classes}>
      <div className="oro-app-header__brand" aria-label="ORO Home Equity Explorer">
        <span className="oro-app-header__logo">ORO</span>
        <span className="oro-app-header__product-name">{productLabel}</span>
      </div>

      {showContext && <p className="oro-app-header__context">{context}</p>}
      {!showContext && <div className="oro-app-header__spacer" aria-hidden="true" />}

      <p className="oro-app-header__notice">{notice}</p>

      {onRestart && (
        <OroButton
          className="oro-app-header__restart"
          variant="tertiary"
          onClick={onRestart}
        >
          {restartLabel}
        </OroButton>
      )}
    </header>
  )
}

export default OroAppHeader
