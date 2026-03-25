import Cookies from 'js-cookie'
import { AuthUser } from '../types'

const TOKEN_KEY = 'mguru_token'
const USER_KEY  = 'mguru_user'

export const setAuthCookie = (user: AuthUser): void => {
  Cookies.set(TOKEN_KEY, user.token, { expires: 7 })
  Cookies.set(USER_KEY, JSON.stringify(user), { expires: 7 })
}

export const getAuthToken = (): string | undefined => Cookies.get(TOKEN_KEY)

export const getAuthUser = (): AuthUser | null => {
  const raw = Cookies.get(USER_KEY)
  if (!raw) return null
  try { return JSON.parse(raw) as AuthUser } catch { return null }
}

export const removeAuthCookie = (): void => {
  Cookies.remove(TOKEN_KEY)
  Cookies.remove(USER_KEY)
}

export const isAuthenticated = (): boolean => !!getAuthToken()
