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
import { observabilityTracker } from '../observability/index.js'

const GUIDED_PROGRESS_LABELS = [
  'Your priorities',
  'Time in home',
  'Payment comfort',
  'Decision priority',
]
const ASSESSMENT_STEP_IDS = ['goal', 'stay', 'payment', 'priority']

function App() {
  const [state, setState] = useState(() => ({
    ...readStoredState(),
    editingInputs: false,
    questionnaireStep: 1,
    revisingAnswers: false,
  }))
  const [isRestartModalOpen, setIsRestartModalOpen] = useState(false)
  const [calculationStatus, setCalculationStatus] = useState(null)
  const [resultsNotice, setResultsNotice] = useState(null)
  const [qaChartState, setQaChartState] = useState(() => {
    const requestedState = new URLSearchParams(globalThis.location?.search || '')
      .get('qaChartState')
    return ['empty', 'error', 'loading'].includes(requestedState)
      ? requestedState
      : null
  })

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
    if (state.screen !== 'results' || !calculationStatus) {
      return undefined
    }

    const completedStatus = calculationStatus
    const clearTimer = window.setTimeout(() => {
      setCalculationStatus(null)
      if (completedStatus === 'updating') {
        setResultsNotice('updated')
      }
    }, 960)

    return () => {
      window.clearTimeout(clearTimer)
    }
  }, [calculationStatus, state.screen])

  function updateState(updates) {
    setState((current) => ({ ...current, ...updates }))
  }

  function handleGuidedStart() {
    observabilityTracker.trackOnce('session-start', 'session_started', { entryPath: 'guided' })
    observabilityTracker.track('guided_flow_started')
    setCalculationStatus(null)
    setResultsNotice(null)
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
    observabilityTracker.trackOnce('session-start', 'session_started', { entryPath: 'direct' })
    observabilityTracker.track('direct_flow_started')
    setCalculationStatus(null)
    setResultsNotice(null)
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
    observabilityTracker.track('assessment_step_completed', { stepId: 'priority' })
    observabilityTracker.track('assessment_completed')
    updateState({
      answers,
      editingInputs: state.revisingAnswers,
      flowMode: 'guided',
      questionnaireStep: 4,
      revisingAnswers: false,
      screen: 'home-details',
    })
  }

  function handleQuestionnaireStepChange(step) {
    const completedStepId = ASSESSMENT_STEP_IDS[step - 2]
    if (completedStepId) {
      observabilityTracker.track('assessment_step_completed', { stepId: completedStepId })
    }
    updateState({ questionnaireStep: step })
  }

  function handleHomeDetailsBack() {
    if (state.editingInputs) {
      updateState({ editingInputs: false, screen: 'results' })
      return
    }

    updateState({
      questionnaireStep: state.flowMode === 'guided' ? 4 : state.questionnaireStep,
      screen: state.flowMode === 'guided' ? 'questionnaire' : 'starter',
    })
  }

  function handleDetailsSubmit(inputs) {
    const isUpdate = state.editingInputs
    const journeyType = state.flowMode === 'direct' ? 'direct' : 'guided'
    observabilityTracker.track('home_details_submitted')
    observabilityTracker.trackOnce(`results-viewed-${journeyType}`, 'results_viewed', { journeyType })
    setCalculationStatus(isUpdate ? 'updating' : 'reviewing')
    setResultsNotice(null)
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
    if (['questionnaire', 'home-details', 'results'].includes(state.screen)) {
      observabilityTracker.track('flow_restarted', { fromStage: state.screen })
    }
    clearStoredState()
    setCalculationStatus(null)
    setResultsNotice(null)
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
    if (!state.selectedIds.includes(productId) && state.selectedIds.length < 3) {
      observabilityTracker.track('product_selected', { productId })
    }

    setState((current) => {
      const selectedIds = current.selectedIds.includes(productId)
        ? current.selectedIds.filter((id) => id !== productId)
        : current.selectedIds.length < 3
          ? [...current.selectedIds, productId]
          : current.selectedIds

      return { ...current, selectedIds }
    })
  }

  function handleOpenDetail(productId) {
    observabilityTracker.track('product_detail_opened', { productId })
    updateState({ detailProductId: productId })
  }

  function handleTabChange(activeTab) {
    if (activeTab === 'compare' && state.selectedIds.length > 0) {
      observabilityTracker.trackOnce(
        `comparison-viewed-${state.flowMode}`,
        'comparison_viewed',
        { productCountBucket: String(Math.min(state.selectedIds.length, 3)) },
      )
    }
    updateState({ activeTab })
  }

  function handleRetryChart() {
    const nextUrl = new URL(globalThis.location.href)
    nextUrl.searchParams.delete('qaChartState')
    globalThis.history.replaceState({}, '', nextUrl)
    setQaChartState(null)
  }

  const guidedStep = Number.isInteger(state.questionnaireStep)
    ? Math.min(Math.max(state.questionnaireStep, 1), GUIDED_PROGRESS_LABELS.length)
    : 1
  const headerContext = state.screen === 'questionnaire'
    ? `Step ${guidedStep} of 6 · ${GUIDED_PROGRESS_LABELS[guidedStep - 1]}`
    : state.screen === 'home-details'
      ? 'Step 5 of 6 · Home details'
      : state.screen === 'results'
        ? resultsNotice === 'updated'
          ? 'Step 6 of 6 · Results updated'
          : 'Step 6 of 6 · Options to explore'
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
          {state.screen === 'starter' && (
            <StarterPage
              onCompareAll={handleDirectStart}
              onGuidedStart={handleGuidedStart}
            />
          )}
          {state.screen === 'questionnaire' && (
            <Questionnaire
              initialAnswers={state.answers}
              initialStep={state.questionnaireStep}
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
              onOpenDetail={handleOpenDetail}
              onRemoveDetail={() => updateState({ detailProductId: null })}
              onRestart={requestRestart}
              onRetryChart={handleRetryChart}
              onSelection={handleSelection}
              onTabChange={handleTabChange}
              calculationStatus={calculationStatus}
              chartState={qaChartState}
              results={results}
              resultsUpdated={resultsNotice === 'updated'}
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
