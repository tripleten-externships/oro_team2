import { useEffect, useRef } from 'react'
import { OroButton } from '../oro-button'
import './oro-restart-modal.css'

function OroRestartModal({ onCancel, onConfirm }) {
  const cancelButtonRef = useRef(null)

  useEffect(() => {
    cancelButtonRef.current?.focus()

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onCancel()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  return (
    <div className="oro-restart-modal" role="presentation">
      <div
        aria-describedby="oro-restart-modal-description"
        aria-labelledby="oro-restart-modal-title"
        aria-modal="true"
        className="oro-restart-modal__dialog"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <p className="oro-restart-modal__eyebrow">Start over</p>
        <h2 id="oro-restart-modal-title">Restart this comparison?</h2>
        <p id="oro-restart-modal-description">
          Your answers, home details, and comparison selections will be cleared so you can
          begin with a clean starter state.
        </p>
        <div className="oro-restart-modal__actions">
          <OroButton ref={cancelButtonRef} variant="secondary" onClick={onCancel}>
            Cancel
          </OroButton>
          <OroButton variant="destructive" onClick={onConfirm}>Confirm restart</OroButton>
        </div>
      </div>
    </div>
  )
}

export default OroRestartModal
