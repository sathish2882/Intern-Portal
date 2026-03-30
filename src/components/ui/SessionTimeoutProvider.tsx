import { useEffect, useRef, useState, ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getToken, clearAuth } from '../../utils/authCookies'

const WARNING_BEFORE_MS = 60 * 1000 // show warning 60s before expiry

/** Decode JWT payload without a library */
const decodeJwtExp = (token: string): number | null => {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null // ms
  } catch {
    return null
  }
}

const formatTime = (ms: number) => {
  const totalSec = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

// Routes that don't need session monitoring
const PUBLIC_ROUTES = ['/login', '/', '/add-user', '/edit-user', '/session-expired']

const SessionTimeoutProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [showWarning, setShowWarning] = useState(false)
  const [remaining, setRemaining] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const expRef = useRef<number | null>(null)

  const cleanup = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setShowWarning(false)
  }

  const handleExpired = () => {
    cleanup()
    clearAuth()
    navigate('/session-expired', { replace: true })
  }

  useEffect(() => {
    // Skip public routes
    if (PUBLIC_ROUTES.some((r) => location.pathname === r)) {
      cleanup()
      return
    }

    const token = getToken()
    if (!token) {
      cleanup()
      return
    }

    const expMs = decodeJwtExp(token)
    if (!expMs) {
      // Token doesn't have exp — can't track
      cleanup()
      return
    }

    expRef.current = expMs

    // Already expired
    if (Date.now() >= expMs) {
      handleExpired()
      return
    }

    // Start interval
    timerRef.current = setInterval(() => {
      const now = Date.now()
      const left = (expRef.current ?? 0) - now

      if (left <= 0) {
        handleExpired()
        return
      }

      setRemaining(left)

      if (left <= WARNING_BEFORE_MS) {
        setShowWarning(true)
      }
    }, 1000)

    return cleanup
  }, [location.pathname])

  return (
    <>
      {children}

      {/* Warning Overlay */}
      {showWarning && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 p-6 text-center animate-fade-in">
            {/* Icon */}
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-amber-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01M12 2a10 10 0 100 20 10 10 0 000-20z"
                />
              </svg>
            </div>

            <h2 className="text-lg font-extrabold text-gray-900 mb-1">
              Session Expiring Soon
            </h2>
            <p className="text-gray-500 text-sm mb-4">
              Your session will expire in
            </p>

            {/* Countdown */}
            <p className="text-3xl font-extrabold text-red-500 font-mono mb-6">
              {formatTime(remaining)}
            </p>

            <button
              onClick={handleExpired}
              className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold rounded-lg hover:opacity-90 transition-all"
            >
              Login Again
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default SessionTimeoutProvider
