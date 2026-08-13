import './oro-comparison-row.css'

function OroComparisonRow({
  label = 'Estimated monthly impact',
  value = '$0',
  className = '',
}) {
  const classes = ['oro-comparison-row', className].filter(Boolean).join(' ')

  return (
    <dl className={classes}>
      <dt className="oro-comparison-row__label">{label}</dt>
      <dd className="oro-comparison-row__value">{value ?? '—'}</dd>
    </dl>
  )
}

export default OroComparisonRow
