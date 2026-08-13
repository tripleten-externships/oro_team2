import './oro-eligibility-badge.css'

const statuses = new Set(['eligible', 'ineligible', 'review'])
const statusContent = {
  eligible: { label: 'Eligible', marker: '✓' },
  ineligible: { label: 'Ineligible', marker: '×' },
  review: { label: 'Review', marker: '!' },
}

function OroEligibilityBadge({
  status = 'eligible',
  label,
  className = '',
}) {
  const normalizedStatus = String(status).toLowerCase()
  const safeStatus = statuses.has(normalizedStatus) ? normalizedStatus : 'review'
  const content = statusContent[safeStatus]
  const classes = [
    'oro-eligibility-badge',
    `oro-eligibility-badge--${safeStatus}`,
    className,
  ].filter(Boolean).join(' ')

  return (
    <span className={classes}>
      <span className="oro-eligibility-badge__marker" aria-hidden="true">
        {content.marker}
      </span>
      <span>{label || content.label}</span>
    </span>
  )
}

export default OroEligibilityBadge
