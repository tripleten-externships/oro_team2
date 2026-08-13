import './oro-chart-axis-label.css'

function OroChartAxisLabel({
  label = 'Year 10',
  className = '',
}) {
  const classes = ['oro-chart-axis-label', className].filter(Boolean).join(' ')

  return <span className={classes}>{label}</span>
}

export default OroChartAxisLabel
