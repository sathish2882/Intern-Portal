import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { AuthState, AuthUser } from '../../types'
import { getAuthUser, setAuthCookie, removeAuthCookie } from '../../utils/authCookies'

const initialState: AuthState = {
  user:      getAuthUser(),
  isLoading: false,
  error:     null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.isLoading = true
      state.error     = null
    },
    loginSuccess: (state, action: PayloadAction<AuthUser>) => {
      state.isLoading = false
      state.user      = action.payload
      state.error     = null
      setAuthCookie(action.payload)
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false
      state.error     = action.payload
    },
    logout: (state) => {
      state.user      = null
      state.isLoading = false
      state.error     = null
      removeAuthCookie()
    },
  },
})

export const { loginStart, loginSuccess, loginFailure, logout } = authSlice.actions
export default authSlice.reducer
