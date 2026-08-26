import { OroButton } from '../oro-button'
import { OroCallout } from '../oro-callout'
import './reviewing-calculations.css'

function ReviewingCalculations({ onBack, onContinue }) {
  return (
    <main className="reviewing-calculations" aria-labelledby="reviewing-calculations-title">
      <section className="reviewing-calculations__panel">
        <p className="reviewing-calculations__eyebrow">Step 3 of 3</p>
        <h1 id="reviewing-calculations-title">Reviewing illustrative calculations</h1>
        <p className="reviewing-calculations__intro">
          We prepared your comparison using the home details and preferences you entered.
        </p>
        <OroCallout type="info" title="Illustrative estimates only">
          These results are educational estimates, not quotes, underwriting decisions, or financial advice.
        </OroCallout>
        <div className="reviewing-calculations__actions">
          <OroButton variant="secondary" onClick={onBack}>Edit home details</OroButton>
          <OroButton onClick={onContinue}>View Illustrative Results</OroButton>
        </div>
      </section>
    </main>
  )
}

export default ReviewingCalculations
