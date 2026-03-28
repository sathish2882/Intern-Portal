import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { TestResult, TestState, TestType } from '../../types'
import { TEST_CONFIG } from '../../utils/testData'

const DEFAULT_TEST_TYPE: TestType = 'aptitude'

const createInitialState = (testType: TestType = DEFAULT_TEST_TYPE): TestState => {
  const config = TEST_CONFIG[testType]

  return {
    activeTestType: testType,
    currentQuestion: 0,
    answers: Array(config.data.total).fill(null),
    testStarted: false,
    testSubmitted: false,
    result: null,
    resultsByType: {},
    timeLeft: config.durationSeconds,
    loading: false,
    error: null,
  }
}

interface SelectAnswerPayload {
  questionIndex: number
  answer: number
}

const initialState: TestState = createInitialState()

const testSlice = createSlice({
  name: 'test',
  initialState,
  reducers: {
    startTest: (state, action: PayloadAction<TestType | undefined>) => {
      const testType = action.payload ?? DEFAULT_TEST_TYPE

      if (state.resultsByType[testType]) return

      Object.assign(state, createInitialState(testType), {
        testStarted: true,
      })
    },

    restartTest: (state, action: PayloadAction<TestType | undefined>) => {
      const testType = action.payload ?? state.activeTestType ?? DEFAULT_TEST_TYPE
      const previousResults = state.resultsByType

      Object.assign(state, createInitialState(testType), {
        testStarted: true,
        resultsByType: previousResults,
      })
    },

    selectAnswer: (state, action: PayloadAction<SelectAnswerPayload>) => {
      state.answers[action.payload.questionIndex] = action.payload.answer
    },

    goToQuestion: (state, action: PayloadAction<number>) => {
      state.currentQuestion = action.payload
    },

    nextQuestion: (state) => {
      const total = TEST_CONFIG[state.activeTestType].data.total
      if (state.currentQuestion < total - 1) {
        state.currentQuestion += 1
      }
    },

    prevQuestion: (state) => {
      if (state.currentQuestion > 0) {
        state.currentQuestion -= 1
      }
    },

    tickTimer: (state) => {
      if (state.timeLeft > 0) {
        state.timeLeft -= 1
      }
    },

    submitTest: (state, action: PayloadAction<TestResult>) => {
      state.testSubmitted = true
      state.testStarted = false
      state.result = action.payload
      state.resultsByType[action.payload.testType] = action.payload
    },

    submitTestStart: (state) => {
      state.loading = true
      state.error = null
    },

    submitTestSuccess: (state, action: PayloadAction<TestResult>) => {
      state.loading = false
      state.testSubmitted = true
      state.testStarted = false
      state.result = action.payload
      state.resultsByType[action.payload.testType] = action.payload
    },

    submitTestFailure: (state, action: PayloadAction<string>) => {
      state.loading = false
      state.error = action.payload
    },

    resetTest: (state) => {
      Object.assign(state, {
        ...createInitialState(state.activeTestType),
        resultsByType: state.resultsByType,
        result: state.result,
        testSubmitted: state.testSubmitted,
      })
    },
  },
})

export const {
  startTest,
  restartTest,
  selectAnswer,
  goToQuestion,
  nextQuestion,
  prevQuestion,
  tickTimer,
  submitTest,
  submitTestStart,
  submitTestSuccess,
  submitTestFailure,
  resetTest,
} = testSlice.actions

export default testSlice.reducer
