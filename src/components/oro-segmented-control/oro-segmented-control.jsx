import { useRef } from 'react'
import { OroSegment } from '../oro-segment'
import './oro-segmented-control.css'

const defaultOptions = [
  { value: 'matches', label: 'Your matches' },
  { value: 'all', label: 'All 7 options' },
  { value: 'compare', label: 'Compare selected' },
]

function OroSegmentedControl({
  options = defaultOptions,
  value = defaultOptions[0].value,
  onChange,
  label = 'Comparison view',
  className = '',
}) {
  const segmentRefs = useRef([])
  const classes = ['oro-segmented-control', className].filter(Boolean).join(' ')

  const selectOption = (option, index) => {
    if (option.disabled) {
      return
    }

    onChange?.(option.value)
    segmentRefs.current[index]?.focus()
  }

  const handleKeyDown = (event, currentIndex) => {
    const enabledIndices = options
      .map((option, index) => option.disabled ? -1 : index)
      .filter((index) => index >= 0)
    const position = enabledIndices.indexOf(currentIndex)

    if (position < 0 || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
      return
    }

    event.preventDefault()
    let nextPosition

    if (event.key === 'Home') {
      nextPosition = 0
    } else if (event.key === 'End') {
      nextPosition = enabledIndices.length - 1
    } else {
      const direction = event.key === 'ArrowRight' ? 1 : -1
      nextPosition = (position + direction + enabledIndices.length)
        % enabledIndices.length
    }

    const nextIndex = enabledIndices[nextPosition]
    selectOption(options[nextIndex], nextIndex)
  }

  return (
    <div
      className={classes}
      role="tablist"
      aria-label={label}
      aria-orientation="horizontal"
    >
      {options.map((option, index) => (
        <OroSegment
          key={option.value}
          ref={(element) => {
            segmentRefs.current[index] = element
          }}
          id={option.id}
          role="tab"
          label={option.label}
          selected={option.value === value}
          disabled={option.disabled}
          aria-controls={option.controls}
          onClick={() => selectOption(option, index)}
          onKeyDown={(event) => handleKeyDown(event, index)}
        />
      ))}
    </div>
  )
}

export default OroSegmentedControl
