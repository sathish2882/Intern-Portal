import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { TestResult, TestState, TestType } from "../../types";
import { TEST_CONFIG } from "../../utils/testData";

const DEFAULT_TEST_TYPE: TestType = "aptitude";

// 🔹 Initial State
const createInitialState = (
  testType: TestType = DEFAULT_TEST_TYPE,
): TestState => {
  const config = TEST_CONFIG[testType];

  return {
    activeTestType: testType,
    currentQuestion: 0,
    answers: Array(config.data.total).fill(null),
    testStarted: false,
    testSubmitted: false,
    result: null,
    resultsByType: {},

    timeLeft: config.durationSeconds,

    // 🔥 API states
    loading: false,
    error: null,
  };
};

interface SelectAnswerPayload {
  questionIndex: number;
  answer: number;
}

const initialState: TestState = createInitialState();

const testSlice = createSlice({
  name: "test",
  initialState,
  reducers: {
    // 🚀 Start Test
    startTest: (state, action: PayloadAction<TestType | undefined>) => {
      const testType = action.payload ?? DEFAULT_TEST_TYPE;

      if (state.resultsByType[testType]) return;

      Object.assign(state, createInitialState(testType), {
        testStarted: true,
      });
    },

    // 🎯 Select Answer
    selectAnswer: (state, action: PayloadAction<SelectAnswerPayload>) => {
      state.answers[action.payload.questionIndex] =
        action.payload.answer;
    },

    // 🔄 Navigation
    goToQuestion: (state, action: PayloadAction<number>) => {
      state.currentQuestion = action.payload;
    },

    nextQuestion: (state) => {
      const total = TEST_CONFIG[state.activeTestType].data.total;
      if (state.currentQuestion < total - 1) {
        state.currentQuestion += 1;
      }
    },

    prevQuestion: (state) => {
      if (state.currentQuestion > 0) {
        state.currentQuestion -= 1;
      }
    },

    // ⏱ Timer
    tickTimer: (state) => {
      if (state.timeLeft > 0) {
        state.timeLeft -= 1;
      }
    },

    // ✅ Local submit (UI only)
    submitTest: (state, action: PayloadAction<TestResult>) => {
      state.testSubmitted = true;
      state.testStarted = false;
      state.result = action.payload;

      state.resultsByType[action.payload.testType] =
        action.payload;
    },

    // 🔥 API Start
    submitTestStart: (state) => {
      state.loading = true;
      state.error = null;
    },

    // 🔥 API Success
    submitTestSuccess: (state, action: PayloadAction<TestResult>) => {
      state.loading = false;
      state.testSubmitted = true;
      state.testStarted = false;
      state.result = action.payload;

      state.resultsByType[action.payload.testType] =
        action.payload;
    },

    // 🔥 API Failure
    submitTestFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // 🔄 Reset Test
    resetTest: (state) => {
      Object.assign(state, {
        ...createInitialState(state.activeTestType),
        resultsByType: state.resultsByType, // keep history
        result: state.result,
        testSubmitted: state.testSubmitted,
      });
    },
  },
});

export const {
  startTest,
  selectAnswer,
  goToQuestion,
  nextQuestion,
  prevQuestion,
  tickTimer,
  submitTest,

  // 🔥 API
  submitTestStart,
  submitTestSuccess,
  submitTestFailure,

  resetTest,
} = testSlice.actions;

export default testSlice.reducer;