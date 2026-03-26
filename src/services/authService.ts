import axios from 'axios'
import { LoginPayload, AuthUser } from '../types'
import { getAuthToken } from '../utils/authCookies'

const BASE_URL = 'https://api.mguru.com'

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

axiosInstance.interceptors.request.use((config) => {
  const token = getAuthToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const loginApi = async (payload: LoginPayload): Promise<AuthUser> => {
  const response = await axiosInstance.post<AuthUser>('/auth/login', payload)
  return response.data
}

export default axiosInstance
