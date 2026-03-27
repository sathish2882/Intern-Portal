import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { removeToken, removeUserType } from '../../utils/authCookies'
import { logoutApi } from '../../services/authApi'

const user = {
  name: 'Sathish',
  email: 'sathish19222978sk@gmail.com',
}

const InternLayout = () => {
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    if (loggingOut) return

    setLoggingOut(true)

    try {
      await logoutApi()
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      removeToken()
      removeUserType()
      toast.success('Logged out successfully')
      navigate('/login', { replace: true })
      setLoggingOut(false)
    }
  }

  return (
    <div className="min-h-screen bg-lightbg font-jakarta text-navy">
      <nav className="bg-white border-b border-line flex items-center justify-between px-4 lg:px-8 h-[60px] sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <div className="w-[34px] h-[34px] bg-blue rounded-lg flex items-center justify-center text-base">
            IN
          </div>
          <span className="text-[17px] font-extrabold text-navy hidden sm:block">
            Intern Portal
          </span>
          <span className="text-[17px] font-extrabold text-navy sm:hidden">
            Intern
          </span>
        </div>


        <div className="flex items-center gap-2 lg:gap-3">
          <div className="flex items-center gap-2 py-[5px] pl-[5px] pr-3 border border-line rounded-[9px]">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue to-[#6b49e8] flex items-center justify-center text-[13px] font-extrabold text-white">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-[13px] font-bold text-navy hidden sm:block">
              {user.name.split(' ')[0]}
            </span>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="h-[34px] px-3 lg:px-4 bg-white border border-line rounded-lg text-slate text-[13px] font-semibold flex items-center gap-1.5 transition-all hover:border-danger hover:text-danger hover:bg-red-50"
          >
            <span className="flex min-h-5 min-w-[72px] items-center justify-center gap-1.5">
              {loggingOut ? (
                <div className="loader-btn loader-btn-sm" />
              ) : (
                <>
                  <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
                  </svg>
                  <span className="hidden sm:inline">Sign Out</span>
                </>
              )}
            </span>
          </button>
        </div>
      </nav>

      <main>
        <Outlet />
      </main>
    </div>
  )
}

export default InternLayout
