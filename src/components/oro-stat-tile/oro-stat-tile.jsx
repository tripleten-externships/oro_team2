import './oro-stat-tile.css'

function OroStatTile({
  label,
  value,
  helper,
  emphasis = 'default',
  className = '',
}) {
  const safeEmphasis = emphasis === 'strong' ? 'strong' : 'default'
  const classes = [
    'oro-stat-tile',
    `oro-stat-tile--${safeEmphasis}`,
    className,
  ].filter(Boolean).join(' ')

  return (
    <dl className={classes}>
      <dt className="oro-stat-tile__label">{label}</dt>
      <dd className="oro-stat-tile__value">{value}</dd>
      {helper && <dd className="oro-stat-tile__helper">{helper}</dd>}
    </dl>
  )
}

export default OroStatTile
