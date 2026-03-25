{/*import { Navigate } from 'react-router-dom'
import { useAppSelector } from '../../redux/hooks'

interface Props {
  children: React.ReactNode
  allowedRole: 'admin' | 'user'
}

const ProtectedRoute = ({ children, allowedRole }: Props) => {
  const { user } = useAppSelector((s) => s.auth)
  if (!user) return <Navigate to="/login" replace />
  if (user.user_type !== allowedRole) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default ProtectedRoute */}
