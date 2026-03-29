import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { TestResult, TestState, TestType, BackendTestResult, UserProfile } from "../../types";
import { TEST_CONFIG } from "../../utils/testData";
import { getTestStatusApi } from "../../services/testApi";

const DEFAULT_TEST_TYPE: TestType = "aptitude";

// ==============================
// ✅ REDUX THUNK - FETCH RESULTS
// ==============================
export const getResult = createAsyncThunk(
  "test/getResult",
  async (_, { rejectWithValue }) => {
    try {
      const res = await getTestStatusApi();
      console.log("🔥 getResult Thunk - API Response:", res?.data);
      return res?.data as BackendTestResult;
    } catch (error: any) {
      console.error("❌ getResult Thunk Error:", error);
      return rejectWithValue(error?.message || "Failed to fetch test results");
    }
  }
);

// ==============================
// ✅ INITIAL STATE CREATOR
// ==============================
const createInitialState = (
  testType: TestType = DEFAULT_TEST_TYPE
): TestState => {
  const config = TEST_CONFIG[testType];

  return {
    activeTestType: testType,
    currentQuestion: 0,
    answers: Array(config.data.total).fill(null),
    testStarted: false,
    testSubmitted: false,
    result: null,
    resultsByType: {}, // 🔥 stores per test result
    backendResult: null, // 🔥 stores backend API result - SINGLE SOURCE OF TRUTH
    currentUser: null, // 🔥 stores current user profile
    timeLeft: config.durationSeconds,
    loading: false,
    error: null,
  };
};

interface SelectAnswerPayload {
  questionIndex: number;
  answer: number;
}

const initialState: TestState = createInitialState();

// ==============================
// ✅ SLICE
// ==============================
const testSlice = createSlice({
  name: "test",
  initialState,
  reducers: {
    // ==========================
    // ✅ START TEST
    // ==========================
    startTest: (state, action: PayloadAction<TestType | undefined>) => {
      const testType = action.payload ?? DEFAULT_TEST_TYPE;

      // 🔥 prevent retake if already completed
      if (state.resultsByType[testType]) return;

      Object.assign(state, createInitialState(testType), {
        testStarted: true,
      });
    },

    // ==========================
    // ✅ RESTART TEST
    // ==========================
    restartTest: (state, action: PayloadAction<TestType | undefined>) => {
      const testType =
        action.payload ?? state.activeTestType ?? DEFAULT_TEST_TYPE;

      const previousResults = state.resultsByType;

      Object.assign(state, createInitialState(testType), {
        testStarted: true,
        resultsByType: previousResults, // 🔥 keep previous results
      });
    },

    // ==========================
    // ✅ ANSWER SELECT
    // ==========================
    selectAnswer: (state, action: PayloadAction<SelectAnswerPayload>) => {
      state.answers[action.payload.questionIndex] =
        action.payload.answer;
    },

    // ==========================
    // ✅ NAVIGATION
    // ==========================
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

    // ==========================
    // ✅ TIMER
    // ==========================
    tickTimer: (state) => {
      if (state.timeLeft > 0) {
        state.timeLeft -= 1;
      }
    },

    // ==========================
    // ✅ SUBMIT TEST (MAIN)
    // ==========================
    submitTest: (state, action: PayloadAction<TestResult>) => {
      state.testSubmitted = true;
      state.testStarted = false;
      state.result = action.payload;

      // 🔥 store per test result
      state.resultsByType[action.payload.testType] =
        action.payload;
    },

    // ==========================
    // ✅ ASYNC STATES (OPTIONAL)
    // ==========================
    submitTestStart: (state) => {
      state.loading = true;
      state.error = null;
    },

    submitTestSuccess: (
      state,
      action: PayloadAction<TestResult>
    ) => {
      state.loading = false;
      state.testSubmitted = true;
      state.testStarted = false;
      state.result = action.payload;

      state.resultsByType[action.payload.testType] =
        action.payload;
    },

    submitTestFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // ==========================
    // ✅ SYNC FROM BACKEND (🔥 NEW)
    // ==========================
    syncResultsFromBackend: (
      state,
      action: PayloadAction<{
        aptitude_score: number;
        technical_score: number;
      }>
    ) => {
      const { aptitude_score, technical_score } = action.payload;

      if (aptitude_score > 0) {
        state.resultsByType["aptitude"] = {
          testType: "aptitude",
          correct: aptitude_score,
          wrong: 0,
          skipped: 0,
          total: TEST_CONFIG.aptitude.data.total,
          passed: false,
          timeTaken: "",
        };
      }

      if (technical_score > 0) {
        state.resultsByType["technical"] = {
          testType: "technical",
          correct: technical_score,
          wrong: 0,
          skipped: 0,
          total: TEST_CONFIG.technical.data.total,
          passed: false,
          timeTaken: "",
        };
      }
    },

    // ==========================
    // ✅ RESET TEST
    // ==========================
    resetTest: (state) => {
      Object.assign(state, {
        ...createInitialState(state.activeTestType),
        resultsByType: state.resultsByType, // 🔥 keep results
        result: state.result,
        testSubmitted: state.testSubmitted,
        backendResult: state.backendResult, // 🔥 keep backend result
      });
    },

    // ==========================
    // ✅ SET CURRENT USER PROFILE
    // ==========================
    setCurrentUser: (state, action: PayloadAction<UserProfile>) => {
      state.currentUser = action.payload;
      console.log("👤 Current user set:", action.payload.name);
    },

    // ==========================
    // ✅ CLEAR ALL TEST DATA (FOR LOGOUT)
    // ==========================
    clearTestData: (state) => {
      Object.assign(state, createInitialState());
      console.log("🧹 Test state cleared on logout");
    },
  },

  // ==============================
  // ✅ EXTRA REDUCERS - HANDLE THUNK
  // ==============================
  extraReducers: (builder) => {
    builder
      // 🔥 Pending
      .addCase(getResult.pending, (state) => {
        state.loading = true;
        state.error = null;
        console.log("⏳ getResult: Loading...");
      })
      // 🔥 Fulfilled
      .addCase(getResult.fulfilled, (state, action) => {
        state.loading = false;
        state.backendResult = action.payload; // 🔥 Store backend result in Redux
        
        // 🔥 SYNC: Update resultsByType so UI displays completed tests
        const { aptitude_score, technical_score } = action.payload;
        
        if (aptitude_score > 0 && !state.resultsByType["aptitude"]) {
          state.resultsByType["aptitude"] = {
            testType: "aptitude",
            correct: aptitude_score,
            wrong: 0,
            skipped: 0,
            total: TEST_CONFIG.aptitude.data.total,
            passed: false,
            timeTaken: "",
          };
        }
        
        if (technical_score > 0 && !state.resultsByType["technical"]) {
          state.resultsByType["technical"] = {
            testType: "technical",
            correct: technical_score,
            wrong: 0,
            skipped: 0,
            total: TEST_CONFIG.technical.data.total,
            passed: false,
            timeTaken: "",
          };
        }
        
        console.log("✅ getResult: Success + Synced to resultsByType", action.payload);
      })
      // 🔥 Rejected
      .addCase(getResult.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        console.error("❌ getResult: Failed", action.payload);
      });
  },
});

// ==============================
// ✅ EXPORTS
// ==============================
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
  syncResultsFromBackend,
  resetTest,
  setCurrentUser,
  clearTestData,
} = testSlice.actions;

export default testSlice.reducer;