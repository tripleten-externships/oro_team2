import check from '../../assets/icons/oro-icon__check.svg'
import chevronDown from '../../assets/icons/oro-icon__chevron-down.svg'
import chevronLeft from '../../assets/icons/oro-icon__chevron-left.svg'
import chevronRight from '../../assets/icons/oro-icon__chevron-right.svg'
import close from '../../assets/icons/oro-icon__close.svg'
import infoMark from '../../assets/icons/oro-icon__info-mark.svg'
import infoRing from '../../assets/icons/oro-icon__info-ring.svg'
import './oro-icon.css'

const iconSources = {
  check: [check],
  'chevron-down': [chevronDown],
  'chevron-left': [chevronLeft],
  'chevron-right': [chevronRight],
  close: [close],
  info: [infoRing, infoMark],
}

function OroIcon({ name = 'info', label, className = '' }) {
  const safeName = iconSources[name] ? name : 'info'
  const classes = [
    'oro-icon',
    `oro-icon--${safeName}`,
    className,
  ].filter(Boolean).join(' ')

  return (
    <span
      className={classes}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {iconSources[safeName].map((source, index) => (
        <img
          className="oro-icon__asset"
          src={source}
          alt=""
          key={`${safeName}-${index}`}
        />
      ))}
    </span>
  )
}

export default OroIcon
