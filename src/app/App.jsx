import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { getResults } from '../application/mortgage-view-model.js'
import {
  clearStoredState,
  createDefaultState,
  EMPTY_ANSWERS,
  persistStoredState,
  readStoredState,
} from '../application/mortgage-storage.js'
import { HomeDetails } from '../components/home-details'
import { OroAppHeader } from '../components/oro-app-header'
import { OroCallout } from '../components/oro-callout'
import { OroRestartModal } from '../components/oro-restart-modal'
import Questionnaire from '../components/Questionnaire/Questionnaire.jsx'
import ResultsPanel from '../components/ResultsPanel/ResultsPanel.jsx'
import StarterPage from '../components/StarterPage/StarterPage.jsx'

const GUIDED_PROGRESS_LABELS = [
  'Your priorities',
  'Time in home',
  'Payment comfort',
  'Decision priority',
]

function App() {
  const [state, setState] = useState(() => ({
    ...readStoredState(),
    editingInputs: false,
    questionnaireStep: 1,
    revisingAnswers: false,
  }))
  const [isRestartModalOpen, setIsRestartModalOpen] = useState(false)
  const [calculationStatus, setCalculationStatus] = useState(() => (
    state.screen === 'results' ? 'reviewing' : null
  ))

  useEffect(() => {
    if (state.screen === 'starter') {
      clearStoredState()
      return
    }

    persistStoredState(state)
  }, [state])

  const results = useMemo(() => {
    if (state.screen !== 'results') {
      return null
    }

    try {
      return getResults(state.inputs, state.answers, state.flowMode === 'direct')
    } catch {
      return null
    }
  }, [state.answers, state.flowMode, state.inputs, state.screen])

  useEffect(() => {
    if (state.screen !== 'results') {
      return undefined
    }

    const clearTimer = window.setTimeout(() => {
      setCalculationStatus(null)
    }, 960)

    return () => {
      window.clearTimeout(clearTimer)
    }
  }, [state.answers, state.inputs, state.screen])

  function updateState(updates) {
    setState((current) => ({ ...current, ...updates }))
  }

  function handleGuidedStart() {
    setCalculationStatus(null)
    updateState({
      answers: { ...EMPTY_ANSWERS },
      activeTab: 'matches',
      detailProductId: null,
      editingInputs: false,
      flowMode: 'guided',
      questionnaireStep: 1,
      revisingAnswers: false,
      screen: 'questionnaire',
      selectedIds: [],
    })
  }

  function handleDirectStart() {
    setCalculationStatus(null)
    updateState({
      activeTab: 'all',
      detailProductId: null,
      editingInputs: false,
      flowMode: 'direct',
      revisingAnswers: false,
      screen: 'home-details',
      selectedIds: [],
    })
  }

  function handleQuestionnaireComplete(answers) {
    updateState({
      answers,
      editingInputs: false,
      flowMode: 'guided',
      revisingAnswers: false,
      screen: 'home-details',
    })
  }

  function handleQuestionnaireStepChange(step) {
    updateState({ questionnaireStep: step })
  }

  function handleHomeDetailsBack() {
    if (state.editingInputs) {
      updateState({ editingInputs: false, screen: 'results' })
      return
    }

    updateState({
      screen: state.flowMode === 'guided' ? 'questionnaire' : 'starter',
    })
  }

  function handleDetailsSubmit(inputs) {
    setCalculationStatus(state.editingInputs ? 'updating' : 'reviewing')
    updateState({
      activeTab: state.flowMode === 'direct' ? 'all' : 'matches',
      detailProductId: null,
      editingInputs: false,
      inputs,
      screen: 'results',
      revisingAnswers: false,
    })
  }

  function requestRestart() {
    setIsRestartModalOpen(true)
  }

  function handleConfirmRestart() {
    clearStoredState()
    setCalculationStatus(null)
    setState({
      ...createDefaultState(),
      editingInputs: false,
      questionnaireStep: 1,
      revisingAnswers: false,
    })
    setIsRestartModalOpen(false)
  }

  function handleReviseAnswers() {
    updateState({
      editingInputs: false,
      questionnaireStep: 1,
      revisingAnswers: true,
      screen: 'questionnaire',
    })
  }

  function handleSelection(productId) {
    setState((current) => {
      const selectedIds = current.selectedIds.includes(productId)
        ? current.selectedIds.filter((id) => id !== productId)
        : current.selectedIds.length < 3
          ? [...current.selectedIds, productId]
          : current.selectedIds

      return { ...current, selectedIds }
    })
  }

  const guidedStep = Number.isInteger(state.questionnaireStep)
    ? Math.min(Math.max(state.questionnaireStep, 1), GUIDED_PROGRESS_LABELS.length)
    : 1
  const headerContext = state.screen === 'questionnaire'
    ? `Step ${guidedStep} of 6 · ${GUIDED_PROGRESS_LABELS[guidedStep - 1]}`
    : state.screen === 'home-details'
      ? 'Step 5 of 6 · Home details'
      : state.screen === 'results'
        ? 'Step 6 of 6 · Options to explore'
        : 'Home equity explorer'

  return (
    <>
      <div
        aria-hidden={isRestartModalOpen}
        className="app"
        inert={isRestartModalOpen ? true : undefined}
      >
        <OroAppHeader
          context={headerContext}
          onRestart={state.screen === 'starter' ? undefined : requestRestart}
          onReviseAnswers={state.screen === 'results' && state.flowMode === 'guided'
            ? handleReviseAnswers
            : undefined}
        />
        <div className="app__content">
          {calculationStatus && state.screen === 'results' && (
            <div className="app__calculation-status" role="status" aria-live="polite">
              {calculationStatus === 'reviewing'
                ? 'Reviewing illustrative calculations'
                : 'Updating illustrative calculations'}
            </div>
          )}
          {state.screen === 'starter' && (
            <StarterPage
              onCompareAll={handleDirectStart}
              onGuidedStart={handleGuidedStart}
            />
          )}
          {state.screen === 'questionnaire' && (
            <Questionnaire
              initialAnswers={state.answers}
              onBack={() => updateState({
                revisingAnswers: false,
                screen: state.revisingAnswers ? 'results' : 'starter',
              })}
              onComplete={handleQuestionnaireComplete}
              onStepChange={handleQuestionnaireStepChange}
            />
          )}
          {state.screen === 'home-details' && (
            <HomeDetails
              initialValues={state.inputs}
              onBack={handleHomeDetailsBack}
              onSubmit={handleDetailsSubmit}
            />
          )}
          {state.screen === 'results' && results && (
            <ResultsPanel
              activeTab={state.activeTab}
              detailProductId={state.detailProductId}
              onEditInputs={() => updateState({ editingInputs: true, screen: 'home-details' })}
              onOpenDetail={(productId) => updateState({ detailProductId: productId })}
              onRemoveDetail={() => updateState({ detailProductId: null })}
              onRestart={requestRestart}
              onSelection={handleSelection}
              onTabChange={(activeTab) => updateState({ activeTab })}
              results={results}
              selectedIds={state.selectedIds}
            />
          )}
          {state.screen === 'results' && !results && (
            <main className="app__error" aria-labelledby="calculation-error-title">
              <OroCallout type="error" title="We could not calculate these options" role="alert">
                Check your home details and try again.
              </OroCallout>
            </main>
          )}
        </div>
      </div>
      {isRestartModalOpen && (
        <OroRestartModal
          onCancel={() => setIsRestartModalOpen(false)}
          onConfirm={handleConfirmRestart}
        />
      )}
    </>
  )
}

export default App
