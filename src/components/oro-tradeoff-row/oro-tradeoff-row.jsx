import './oro-tradeoff-row.css'

const types = new Set(['benefit', 'consideration', 'requirement'])
const markers = {
  benefit: '✓',
  consideration: '!',
  requirement: 'i',
}

function OroTradeoffRow({
  type = 'benefit',
  text = 'Tradeoff description',
  children,
  className = '',
}) {
  const normalizedType = String(type).toLowerCase()
  const safeType = types.has(normalizedType) ? normalizedType : 'consideration'
  const classes = [
    'oro-tradeoff-row',
    `oro-tradeoff-row--${safeType}`,
    className,
  ].filter(Boolean).join(' ')

  return (
    <div className={classes}>
      <span className="oro-tradeoff-row__marker" aria-hidden="true">
        {markers[safeType]}
      </span>
      <span className="oro-tradeoff-row__text">{children ?? text}</span>
    </div>
  )
}

export default OroTradeoffRow
