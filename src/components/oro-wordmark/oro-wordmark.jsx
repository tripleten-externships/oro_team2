import leftDot from '../../assets/brand/oro-wordmark__left-dot.svg'
import leftO from '../../assets/brand/oro-wordmark__left-o.svg'
import letterR from '../../assets/brand/oro-wordmark__r.svg'
import rightDot from '../../assets/brand/oro-wordmark__right-dot.svg'
import rightO from '../../assets/brand/oro-wordmark__right-o.svg'
import './oro-wordmark.css'

const wordmarkParts = [
  ['left-o', leftO],
  ['r', letterR],
  ['right-o', rightO],
  ['left-dot', leftDot],
  ['right-dot', rightDot],
]

function WordmarkArtwork({ className, decorative = false }) {
  return (
    <span
      className={className}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : 'Oro'}
      aria-hidden={decorative || undefined}
    >
      {wordmarkParts.map(([name, source]) => (
        <span className={`oro-wordmark__part oro-wordmark__part--${name}`} key={name}>
          <img className="oro-wordmark__asset" src={source} alt="" />
        </span>
      ))}
    </span>
  )
}

function OroWordmark({ href, className = '', label = 'Oro home' }) {
  const classes = ['oro-wordmark', className].filter(Boolean).join(' ')

  if (href) {
    return (
      <a className={classes} href={href} aria-label={label}>
        <WordmarkArtwork className="oro-wordmark__artwork" decorative />
      </a>
    )
  }

  return <WordmarkArtwork className={classes} />
}

export default OroWordmark
