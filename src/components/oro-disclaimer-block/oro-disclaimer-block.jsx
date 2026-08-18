import { OroCallout } from '../oro-callout'
import './oro-disclaimer-block.css'

function OroDisclaimerBlock({
  title = 'Important: illustrative information',
  children = 'This educational tool does not provide financial advice or guarantee eligibility, rates, savings, approval, or future home value.',
  className = '',
}) {
  const classes = ['oro-disclaimer-block', className].filter(Boolean).join(' ')

  return (
    <aside className={classes} aria-label={title}>
      <OroCallout type="info" title={title} surface="card">
        {children}
      </OroCallout>
    </aside>
  )
}

export default OroDisclaimerBlock
