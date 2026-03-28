import { useState } from 'react'
import { ReadOutlined } from '@ant-design/icons'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { removeToken, removeUserType } from '../../utils/authCookies'
import { logoutApi } from '../../services/authApi'

const user = {
  name: 'Sathish',
  email: 'sathish19222978sk@gmail.com',
}

const UserLayout = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)
  const showAssessmentHeader = location.pathname === '/user/dashboard'

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
      {showAssessmentHeader && (
        <nav className="sticky top-0 z-50 flex h-[60px] items-center justify-between border-b border-line bg-white px-4 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-[34px] w-[34px] items-center justify-center rounded-lg bg-blue text-[17px] text-white">
              <ReadOutlined />
            </div>
            <span className="hidden text-[17px] font-extrabold text-navy sm:block">
              Assessment Portal
            </span>
            <span className="text-[17px] font-extrabold text-navy sm:hidden">
              M-Guru
            </span>
          </div>

          <div className="flex items-center gap-2 lg:gap-3">
            <div className="flex items-center gap-2 rounded-[9px] border border-line py-[5px] pl-[5px] pr-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue to-[#6b49e8] text-[13px] font-extrabold text-white">
                {user?.name?.charAt(0).toUpperCase() ?? 'U'}
              </div>
              <span className="hidden text-[13px] font-bold text-navy sm:block">
                {user?.name?.split(' ')[0] ?? 'User'}
              </span>
            </div>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex h-[34px] items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-[13px] font-semibold text-slate transition-all hover:border-danger hover:bg-red-50 hover:text-danger lg:px-4"
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
      )}

      <main>
        <Outlet />
      </main>
    </div>
  )
}

export default UserLayout
