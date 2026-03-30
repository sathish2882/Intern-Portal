import Cookies from 'js-cookie'

// 🔹 TOKEN (Normal Users)
export const setToken = (token: string) => {
  Cookies.set('token', token, { expires: 7 })
}

export const getToken = () => {
  return Cookies.get('token') || null
}

export const removeToken = () => {
  Cookies.remove('token')
}

// 🔹 USER TYPE
export const setUser = (userType: string) => {
  Cookies.set('userType', userType, { expires: 7 })
}

export const getUserType = () => {
  return Cookies.get('userType') || null
}

export const removeUserType = () => {
  Cookies.remove('userType')
}

// 🔹 USER ID (Exam Users)
export const setUserId = (userId: string) => {
  Cookies.set('userId', userId, { expires: 7 })
}

export const getUserId = () => {
  return Cookies.get('userId') || null
}

export const removeUserId = () => {
  Cookies.remove('userId')
}

// 🔥 IMPORTANT HELPERS

// ✅ Check if JWT token is expired
export const isTokenExpired = (): boolean => {
  const token = getToken()
  if (!token) return true

  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    if (!payload.exp) return true
    return Date.now() >= payload.exp * 1000
  } catch {
    return true
  }
}

// ✅ Exam user → has userId but NO token
export const isExamUser = () => {
  const userId = getUserId()
  const token = getToken()
  return !!userId && !token
}

// ✅ Normal user → has token
export const isNormalUser = () => {
  return !!getToken()
}

// 🔥 Logout (clean everything)
export const clearAuth = () => {
  removeToken()
  removeUserId()
  removeUserType()
}