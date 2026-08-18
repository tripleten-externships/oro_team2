import { OroCallout } from '../oro-callout'
import './oro-help-panel.css'

function OroHelpPanel({
  title = 'Why we ask',
  children = 'Your answers help the tool explain which options may align with your priorities. They are not used to make an approval decision.',
  className = '',
}) {
  const classes = ['oro-help-panel', className].filter(Boolean).join(' ')

  return (
    <aside className={classes} aria-label={title}>
      <OroCallout type="info" title={title} surface="card">
        {children}
      </OroCallout>
    </aside>
  )
}

export default OroHelpPanel
