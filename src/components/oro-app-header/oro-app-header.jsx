import './oro-app-header.css'

function OroAppHeader({
  productLabel = 'Home equity explorer',
  notice = 'Illustrative estimates · Educational only · Inputs stay on this device',
  className = '',
}) {
  const classes = ['oro-app-header', className].filter(Boolean).join(' ')

  return (
    <header className={classes}>
      <div className="oro-app-header__brand" aria-label="ORO Home Equity Explorer">
        <span className="oro-app-header__logo">ORO</span>
        <span className="oro-app-header__product-name">{productLabel}</span>
      </div>

      <div className="oro-app-header__spacer" aria-hidden="true" />
      <p className="oro-app-header__notice">{notice}</p>
    </header>
  )
}

export default OroAppHeader
