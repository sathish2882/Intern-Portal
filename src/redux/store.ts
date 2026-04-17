import { configureStore } from '@reduxjs/toolkit'
import customerReducer from './slices/customerSlice'
import testReducer     from './slices/testSlice'

export const store = configureStore({
  reducer: {
    customers: customerReducer,
    test:      testReducer,
  },
})

// Save test state to localStorage whenever it changes
store.subscribe(() => {
  try {
    const state = store.getState();
    localStorage.setItem('redux-test-state', JSON.stringify(state.test));
  } catch (e) {
    console.error('Failed to save test state to localStorage:', e);
  }
});

export type RootState   = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
