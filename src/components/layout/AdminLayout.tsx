import { useEffect, useMemo, useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'
import { MailOutlined } from '@ant-design/icons'
import { IoTimeOutline } from 'react-icons/io5'
import { removeToken, removeUserType } from '../../utils/authCookies'
import { getMeApi, logoutApi } from '../../services/authApi'
import { CurrentUserProfile } from '../../types'

const FALLBACK_USER = {
  name: 'Admin',
  email: '',
}

const NAV_ITEMS = [
  {
    to: '/admin/payment/dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
        <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
      </svg>
    ),
  },
  {
    to: '/admin/payment/send-email',
    label: ' email',
    icon: <MailOutlined />,
  },
  {
    to: '/admin/payment/users',
    label: 'users',
    icon: (
      <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
      </svg>
    ),
  },
  {
    to: '/admin/payment/email-history',
    label: 'history',
    icon: <IoTimeOutline />,
  },
]

const AdminLayout = () => {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  // ✅ Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [profile, setProfile] = useState<CurrentUserProfile | null>(null)

  useEffect(() => {
    let mounted = true

    const loadProfile = async () => {
      try {
        const response = await getMeApi()
        if (mounted) {
          setProfile(response.data)
        }
      } catch (error: any) {
        console.error('Failed to load profile:', error)
        toast.error(error?.response?.data?.detail || 'Failed to load profile')
      } finally {
        if (mounted) {
          setLoadingProfile(false)
        }
      }
    }

    void loadProfile()

    return () => {
      mounted = false
    }
  }, [])

  const user = useMemo(() => {
    if (!profile) return FALLBACK_USER

    return {
      name: profile.username || FALLBACK_USER.name,
      email: profile.email || FALLBACK_USER.email,
    }
  }, [profile])

  const handleLogout = async () => {
    if (loggingOut) return

    setLoggingOut(true)

    try {
      await logoutApi()
    } catch (error: any) {
      console.error('Logout failed:', error)
      toast.error(error?.response?.data?.detail || 'Logout failed')
    } finally {
      removeToken()
      removeUserType()
      toast.success('Logged out successfully')
      navigate('/login', { replace: true })
      setLoggingOut(false)
    }
  }

  const SidebarContent = () => (
    <>
      <div className="border-b border-white/[0.07] px-3 py-5">
        <NavLink
          to="/admin/portals"
          onClick={() => setMobileOpen(false)}
          title="PayDesk"
          className={`flex items-center ${collapsed ? 'justify-center' : 'gap-4 px-1'}`}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-golddim text-gold">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M6 4h9a5 5 0 0 1 0 10H9v6H6V4Zm3 3v4h6a2 2 0 1 0 0-4H9Z" />
            </svg>
          </span>
          {!collapsed && (
            <span className="font-syne font-extrabold text-2xl text-adark tracking-wide whitespace-nowrap overflow-hidden">
              PayDesk
            </span>
          )}
        </NavLink>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 p-2.5">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setMobileOpen(false)}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-lg font-medium transition-all duration-150 font-syne ${
                isActive
                  ? 'bg-golddim text-goldtxt'
                  : 'text-amuted hover:bg-abg3 hover:text-adark'
              } ${collapsed ? 'justify-center' : ''}`
            }
          >
            <span className="w-5 flex-shrink-0 text-center">{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/[0.07] p-3 space-y-2">
        {!collapsed && (
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.04] min-h-[52px]">
            {loadingProfile ? (
              <div className="flex w-full items-center justify-center">
                <div className="loader-btn loader-btn-sm" />
              </div>
            ) : (
              <>
                <div className="w-8 h-8 rounded-full bg-asuccess flex items-center justify-center text-xs font-bold text-abg flex-shrink-0 shadow-[0_0_6px_#3dba78]">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-adark font-syne truncate">{user.name}</p>
                  <p className="text-xs text-amuted font-mono truncate">{user.email}</p>
                </div>
              </>
            )}
          </div>
        )}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          title={collapsed ? 'Sign Out' : undefined}
          className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-lg font-medium text-adanger hover:bg-adanger/10 transition-all font-syne ${collapsed ? 'justify-center' : ''}`}
        >
          <span className="flex min-h-6 min-w-[88px] items-center justify-center gap-2.5">
            {loggingOut ? (
              <div className="loader-btn loader-btn-sm" />
            ) : (
              <>
                <svg className="flex-shrink-0" width="15" height="15" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
                </svg>
                {!collapsed && 'Sign Out'}
              </>
            )}
          </span>
        </button>
      </div>
    </>
  )

  return (
    <div className="flex min-h-screen bg-abg font-syne text-adark admin-scroll">
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`hidden lg:flex flex-col flex-shrink-0 bg-abg2 border-r border-white/[0.07] min-h-screen transition-all duration-300 ${collapsed ? 'w-16' : 'w-56'}`}
      >
        <SidebarContent />
      </aside>

      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-abg2 border-r border-white/[0.07] z-50 flex flex-col transition-transform duration-300 lg:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <SidebarContent />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 flex items-center justify-between px-4 lg:px-6 bg-abg2 border-b border-white/[0.07] flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg text-amuted hover:bg-abg3 transition-colors"
            >
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
              </svg>
            </button>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex p-2 rounded-lg text-amuted hover:bg-abg3 transition-colors"
            >
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
              </svg>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-7 overflow-auto bg-abg">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout

