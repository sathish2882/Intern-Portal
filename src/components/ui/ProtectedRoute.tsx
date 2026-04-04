import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import {
  getToken,
  getUserId,
  getUserType,
} from '../../utils/authCookies'

interface ProtectedRouteProps {
  children: ReactNode
  role?: string
  guestOnly?: boolean
}

const getRedirectByUserType = (userType?: string) => {
  if (userType === '1') return '/admin/portals'
  if (userType === '2') return '/intern/dashboard'
  if (userType === '3') return '/user/dashboard'
  return '/login'
}

const ProtectedRoute = ({
  children,
  role,
  guestOnly = false,
}: ProtectedRouteProps) => {
  const token = getToken()
  const userType = getUserType()
  const userId = getUserId()

  //  EXAM USER CHECK
  const isExamUserLoggedIn =
    userType === '3' && Boolean(userId)

  //  FINAL LOGIN CHECK
  const isLoggedIn = Boolean(token) || isExamUserLoggedIn

  // 🔹 GUEST ONLY ROUTES (login page)
  if (guestOnly) {
    return isLoggedIn ? (
      <Navigate to={getRedirectByUserType(userType ?? undefined)} replace />
    ) : (
      <>{children}</>
    )
  }

  // 🔹 NOT LOGGED IN
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }

  // 🔹 ROLE CHECK
  if (role && userType !== role) {
    return <Navigate to={getRedirectByUserType(userType ?? undefined)} replace />
  }

  return <>{children}</>
}

export default ProtectedRoute