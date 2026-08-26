import { DEFAULT_INPUTS } from '../domain/mortgage-calculator.js'

const STORAGE_KEY = 'oro-home-equity-explorer'
const VALID_SCREENS = new Set(['starter', 'questionnaire', 'home-details', 'reviewing', 'results'])

const EMPTY_ANSWERS = Object.freeze({
  goal: '',
  stay: '',
  payment: '',
  priority: '',
})

const DEFAULT_VIEW_STATE = Object.freeze({
  activeTab: 'matches',
  selectedIds: [],
  detailProductId: null,
  flowMode: 'guided',
})

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function normalizeInputs(storedInputs) {
  if (!isRecord(storedInputs)) {
    return { ...DEFAULT_INPUTS }
  }

  return {
    ...DEFAULT_INPUTS,
    ...storedInputs,
    currentMortgageRateAnnualPercent: storedInputs.currentMortgageRateAnnualPercent
      ?? storedInputs.currentMortgageRate
      ?? DEFAULT_INPUTS.currentMortgageRateAnnualPercent,
    age: storedInputs.age ?? storedInputs.homeOwnerAge ?? DEFAULT_INPUTS.age,
  }
}

function createDefaultState() {
  return {
    screen: 'starter',
    answers: { ...EMPTY_ANSWERS },
    inputs: { ...DEFAULT_INPUTS },
    ...DEFAULT_VIEW_STATE,
  }
}

function readStoredState(storage = globalThis.localStorage) {
  const fallback = createDefaultState()

  if (!storage) {
    return fallback
  }

  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) {
      return fallback
    }

    const stored = JSON.parse(raw)
    if (!isRecord(stored)) {
      return fallback
    }

    return {
      screen: VALID_SCREENS.has(stored.screen) ? stored.screen : fallback.screen,
      answers: { ...EMPTY_ANSWERS, ...(isRecord(stored.answers) ? stored.answers : {}) },
      inputs: normalizeInputs(stored.inputs),
      activeTab: ['matches', 'all', 'compare'].includes(stored.activeTab)
        ? stored.activeTab
        : 'matches',
      selectedIds: Array.isArray(stored.selectedIds) ? stored.selectedIds.slice(0, 3) : [],
      detailProductId: typeof stored.detailProductId === 'string'
        ? stored.detailProductId
        : null,
      flowMode: stored.flowMode === 'direct' ? 'direct' : 'guided',
    }
  } catch {
    try {
      storage.removeItem(STORAGE_KEY)
    } catch {
      return fallback
    }

    return fallback
  }
}

function persistStoredState(state, storage = globalThis.localStorage) {
  if (!storage) {
    return
  }

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify({
      screen: state.screen,
      answers: state.answers,
      inputs: state.inputs,
      activeTab: state.activeTab,
      selectedIds: state.selectedIds,
      detailProductId: state.detailProductId,
      flowMode: state.flowMode,
    }))
  } catch {
    return
  }
}

function clearStoredState(storage = globalThis.localStorage) {
  if (!storage) {
    return
  }

  try {
    storage.removeItem(STORAGE_KEY)
  } catch {
    return
  }
}

export {
  EMPTY_ANSWERS,
  STORAGE_KEY,
  clearStoredState,
  createDefaultState,
  persistStoredState,
  readStoredState,
}
