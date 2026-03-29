import { useNavigate } from 'react-router-dom'
import { clearAuth } from '../../utils/authCookies'

const SessionExpired = () => {
  const navigate = useNavigate()

  const handleLogin = () => {
    clearAuth()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
        {/* Icon */}
        <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-red-50 flex items-center justify-center">
          <svg
            className="w-10 h-10 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">
          Session Expired
        </h1>
        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
          Your session has timed out due to inactivity or your token has expired.
          Please log in again to continue.
        </p>

        {/* Login Button */}
        <button
          onClick={handleLogin}
          className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold rounded-lg hover:opacity-90 transition-all"
        >
          Back to Login
        </button>
      </div>
    </div>
  )
}

export default SessionExpired
