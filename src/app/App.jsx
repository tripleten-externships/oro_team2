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
import Questionnaire from '../components/Questionnaire/Questionnaire.jsx'
import { ReviewingCalculations } from '../components/reviewing-calculations'
import ResultsPanel from '../components/ResultsPanel/ResultsPanel.jsx'
import StarterPage from '../components/StarterPage/StarterPage.jsx'

function App() {
  const [state, setState] = useState(() => readStoredState())

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

  function updateState(updates) {
    setState((current) => ({ ...current, ...updates }))
  }

  function handleGuidedStart() {
    updateState({
      answers: { ...EMPTY_ANSWERS },
      activeTab: 'matches',
      detailProductId: null,
      flowMode: 'guided',
      screen: 'questionnaire',
      selectedIds: [],
    })
  }

  function handleDirectStart() {
    updateState({
      activeTab: 'all',
      detailProductId: null,
      flowMode: 'direct',
      screen: 'home-details',
      selectedIds: [],
    })
  }

  function handleQuestionnaireComplete(answers) {
    updateState({
      answers,
      flowMode: 'guided',
      screen: 'home-details',
    })
  }

  function handleHomeDetailsBack() {
    updateState({
      screen: state.flowMode === 'guided' ? 'questionnaire' : 'starter',
    })
  }

  function handleDetailsSubmit(inputs) {
    updateState({
      activeTab: state.flowMode === 'direct' ? 'all' : 'matches',
      detailProductId: null,
      inputs,
      screen: 'reviewing',
      selectedIds: [],
    })
  }

  function handleViewIllustrativeResults() {
    updateState({
      screen: 'results',
    })
  }

  function handleRestart() {
    clearStoredState()
    setState(createDefaultState())
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

  const headerContext = state.screen === 'questionnaire'
    ? 'Guided questions'
    : state.screen === 'home-details'
      ? 'Home details'
      : state.screen === 'reviewing'
        ? 'Reviewing calculations'
      : state.screen === 'results'
        ? 'Options to explore'
        : 'Home equity explorer'

  return (
    <div className="app">
      <OroAppHeader
        context={headerContext}
        onRestart={state.screen === 'starter' ? undefined : handleRestart}
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
            onBack={() => updateState({ screen: 'starter' })}
            onComplete={handleQuestionnaireComplete}
          />
        )}
        {state.screen === 'home-details' && (
          <HomeDetails
            initialValues={state.inputs}
            onBack={handleHomeDetailsBack}
            onSubmit={handleDetailsSubmit}
          />
        )}
        {state.screen === 'reviewing' && (
          <ReviewingCalculations
            onBack={() => updateState({ screen: 'home-details' })}
            onContinue={handleViewIllustrativeResults}
          />
        )}
        {state.screen === 'results' && results && (
          <ResultsPanel
            activeTab={state.activeTab}
            detailProductId={state.detailProductId}
            onEditInputs={() => updateState({ screen: 'home-details' })}
            onOpenDetail={(productId) => updateState({ detailProductId: productId })}
            onRemoveDetail={() => updateState({ detailProductId: null })}
            onRestart={handleRestart}
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
  )
}

export default App
