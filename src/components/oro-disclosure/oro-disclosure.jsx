import { useState } from 'react'
import './oro-disclosure.css'

const variants = new Set(['tooltip', 'definition', 'accordion'])

function OroDisclosure({
  variant = 'tooltip',
  title = 'How this works',
  body,
  children,
  open,
  defaultOpen = false,
  onToggle,
  className = '',
  ...disclosureProps
}) {
  const accordionAlias = variant === 'accordion-open' || variant === 'accordion-closed'
  const safeVariant = accordionAlias
    ? 'accordion'
    : variants.has(variant) ? variant : 'tooltip'
  const [uncontrolledOpen, setUncontrolledOpen] = useState(
    variant === 'accordion-open' || defaultOpen,
  )
  const content = children || body || 'Plain-language educational explanation.'
  const classes = [
    'oro-disclosure',
    `oro-disclosure--${safeVariant}`,
    className,
  ].filter(Boolean).join(' ')

  if (safeVariant === 'accordion') {
    const isOpen = open ?? uncontrolledOpen

    return (
      <details
        {...disclosureProps}
        className={classes}
        open={isOpen}
        onToggle={(event) => {
          if (open === undefined) {
            setUncontrolledOpen(event.currentTarget.open)
          }
          onToggle?.(event)
        }}
      >
        <summary className="oro-disclosure__summary">{title}</summary>
        <div className="oro-disclosure__body">{content}</div>
      </details>
    )
  }

  const semanticProps = safeVariant === 'tooltip'
    ? { role: 'tooltip' }
    : { 'aria-label': title }

  return (
    <aside {...disclosureProps} {...semanticProps} className={classes}>
      <strong className="oro-disclosure__title">{title}</strong>
      <div className="oro-disclosure__body">{content}</div>
    </aside>
  )
}

export default OroDisclosure
