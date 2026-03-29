import API from './authInstance'
import { getUserId } from '../utils/authCookies'

// 🔹 AUTH
export const loginApi = (data: any) => {
  return API.post('/login', data)
}
export const signupApi = (data: any) => {
  return API.post('/signup', data)
}

export const logoutApi = () => {
  return API.post('/logout')
}

// 🔹 NORMAL USER (TOKEN BASED)
export const getMeApi = () => {
  return API.get('/me')
}

export const getDashboardApi = (batchId?: number | string) => {
  return API.post('/dashboard', null, {
    params: batchId ? { batch_id: batchId } : undefined,
  })
}

// 🔹 EXAM USER (USER ID BASED)
export const getExamUserApi = () => {
  const userId = getUserId()
  return API.get(`/users/${userId}`)
}

export const saveExamUserDetailsApi = (data: { name: string; email: string }) => {
  const userId = getUserId()
  return API.post(`/users/${userId}/details`, data)
}

// 🔹 COMMON (if needed manually)
export const getUserByIdApi = (userId: number | string) => {
  return API.get(`/users/${userId}`)
}

export const saveUserDetailsApi = (
  userId: number | string,
  data: { name: string; email: string }
) => {
  return API.post(`/users/${userId}/details`, data)
}

// 🔹 OTHER FEATURES
export const submitTestApi = (data: any) => {
  return API.post('/submit-test', data)
}

export const getBatchesApi = () => {
  return API.get('/batches')
}

export const getUserByBatchApi = (batchId: number | string) => {
  return API.get(`/get_userby_batch/${batchId}`)
}

export const paymentEmailApi = (data: any) => {
  return API.post('/payment_email', data)
}

export const getExamSummaryApi = () => {
  return API.get('/exam-summary')
}

export const updateUserApi = (userId: number | string, data: any) => {
  return API.put(`/update_users/${userId}`, data)
}