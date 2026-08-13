import './oro-chart-tooltip.css'

function OroChartTooltip({
  context = 'HEI · Year 10',
  value = '$286,000 equity',
  className = '',
}) {
  const classes = ['oro-chart-tooltip', className].filter(Boolean).join(' ')

  return (
    <output className={classes} role="tooltip">
      <span className="oro-chart-tooltip__context">{context}</span>
      <strong className="oro-chart-tooltip__value">{value}</strong>
    </output>
  )
}

export default OroChartTooltip
