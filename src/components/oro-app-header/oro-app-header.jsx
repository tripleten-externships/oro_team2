import { OroButton } from '../oro-button'
import { OroWordmark } from '../oro-wordmark'
import './oro-app-header.css'

function OroAppHeader({
  context,
  productLabel,
  notice,
  restartLabel = 'Restart',
  onRestart,
  brandHref,
  className = '',
}) {
  const classes = ['oro-app-header', className].filter(Boolean).join(' ')
  const journeyContext = context
    || notice
    || productLabel
    || 'Step 1 of 6 · Guided questions'

  return (
    <header className={classes}>
      <OroWordmark
        className="oro-app-header__wordmark"
        href={brandHref}
      />
      <p className="oro-app-header__context">{journeyContext}</p>
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
