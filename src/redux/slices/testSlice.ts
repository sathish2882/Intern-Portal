import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { TestState, TestResult } from '../../types'

const TOTAL    = 22
const DURATION = 45 * 60

const initialState: TestState = {
  currentQuestion: 0,
  answers:         Array(TOTAL).fill(null),
  testStarted:     false,
  testSubmitted:   false,
  result:          null,
  timeLeft:        DURATION,
}

const testSlice = createSlice({
  name: 'test',
  initialState,
  reducers: {
    startTest: (state) => {
      state.testStarted     = true
      state.testSubmitted   = false
      state.result          = null
      state.currentQuestion = 0
      state.answers         = Array(TOTAL).fill(null)
      state.timeLeft        = DURATION
    },
    selectAnswer: (state, action: PayloadAction<{ questionIndex: number; answer: number }>) => {
      state.answers[action.payload.questionIndex] = action.payload.answer
    },
    goToQuestion: (state, action: PayloadAction<number>) => {
      state.currentQuestion = action.payload
    },
    nextQuestion: (state) => {
      if (state.currentQuestion < TOTAL - 1) state.currentQuestion += 1
    },
    prevQuestion: (state) => {
      if (state.currentQuestion > 0) state.currentQuestion -= 1
    },
    tickTimer: (state) => {
      if (state.timeLeft > 0) state.timeLeft -= 1
    },
    submitTest: (state, action: PayloadAction<TestResult>) => {
      state.testSubmitted = true
      state.testStarted   = false
      state.result        = action.payload
    },
    resetTest: (state) => {
      Object.assign(state, initialState)
    },
  },
})

export const {
  startTest, selectAnswer, goToQuestion,
  nextQuestion, prevQuestion, tickTimer,
  submitTest, resetTest,
} = testSlice.actions

export default testSlice.reducer
