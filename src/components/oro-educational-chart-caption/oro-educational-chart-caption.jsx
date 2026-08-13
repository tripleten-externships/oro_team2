import './oro-educational-chart-caption.css'

function OroEducationalChartCaption({
  children = 'Illustrative estimate: compare the direction and tradeoff of each option, not a guaranteed future value.',
  className = '',
}) {
  const classes = [
    'oro-educational-chart-caption',
    className,
  ].filter(Boolean).join(' ')

  return (
    <aside className={classes} aria-label="Chart information">
      <span className="oro-educational-chart-caption__marker" aria-hidden="true">
        i
      </span>
      <p>{children}</p>
    </aside>
  )
}

export default OroEducationalChartCaption
