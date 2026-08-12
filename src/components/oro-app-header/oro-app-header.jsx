import './oro-app-header.css'

function OroAppHeader({
  productLabel = 'Home equity explorer',
  notice,
  className = '',
}) {
  const classes = ['oro-app-header', className].filter(Boolean).join(' ')
  const desktopNotice = notice
    || 'Illustrative estimates · Educational only · Inputs stay on this device'
  const mobileNotice = notice || 'Illustrative · educational only'

  return (
    <header className={classes}>
      <div className="oro-app-header__brand">
        <span className="oro-app-header__wordmark" aria-label="ORO">ORO</span>
        <span className="oro-app-header__product">{productLabel}</span>
      </div>
      <p className="oro-app-header__notice oro-app-header__notice--desktop">
        {desktopNotice}
      </p>
      <p className="oro-app-header__notice oro-app-header__notice--mobile">
        {mobileNotice}
      </p>
    </header>
  )
}

export default OroAppHeader
