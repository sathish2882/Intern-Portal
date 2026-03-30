import { useEffect, useMemo, useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Button } from 'antd'

import { removeToken, removeUserType } from '../../utils/authCookies'
import { getMeApi, logoutApi } from '../../services/authApi'
import { checkInApi, checkOutApi } from '../../services/attendanceApi'

import { CurrentUserProfile } from '../../types'
import { capitalizeName } from '../../utils/formatName'
import welcomeLogo from "../../assets/images/jpg/welcome-logo.jpg"

const FALLBACK_USER = {
  name: 'Intern',
  email: '',
}

const InternLayout = () => {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const [loggingOut, setLoggingOut] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [profile, setProfile] = useState<CurrentUserProfile | null>(null)

  const [attendanceStatus, setAttendanceStatus] = useState<'IN' | 'OUT'>('OUT')
  const [attendanceLoading, setAttendanceLoading] = useState(false)

  // ✅ Scroll to top
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  // ✅ Load Profile
  useEffect(() => {
    let mounted = true

    const loadProfile = async () => {
      try {
        const res = await getMeApi()
        if (mounted) {
          setProfile(res.data)

          // OPTIONAL: if backend gives attendance status
          // setAttendanceStatus(res.data.attendance_status)
        }
      } catch (error: any) {
        toast.error(error?.response?.data?.detail || 'Failed to load profile')
      } finally {
        if (mounted) setLoadingProfile(false)
      }
    }

    loadProfile()

    return () => {
      mounted = false
    }
  }, [])

  const user = useMemo(() => {
    if (!profile) return FALLBACK_USER

    return {
      name: capitalizeName(profile.username || FALLBACK_USER.name),
      email: profile.email || FALLBACK_USER.email,
    }
  }, [profile])

  // ✅ Check-In / Check-Out Handler
  const handleAttendance = async () => {
    if (attendanceLoading) return

    setAttendanceLoading(true)

    try {
      if (attendanceStatus === 'OUT') {
        await checkInApi()
        setAttendanceStatus('IN')
        toast.success('Checked in successfully')
      } else {
        await checkOutApi()
        setAttendanceStatus('OUT')
        toast.success('Checked out successfully')
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Attendance failed')
    } finally {
      setAttendanceLoading(false)
    }
  }

  // ✅ Logout
  const handleLogout = async () => {
    if (loggingOut) return

    setLoggingOut(true)

    try {
      await logoutApi()
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Logout failed')
    } finally {
      removeToken()
      removeUserType()
      toast.success('Logged out successfully')
      navigate('/login', { replace: true })
      setLoggingOut(false)
    }
  }

  // ✅ AUTO CHECKOUT AT 6 PM
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date()
      const hours = now.getHours()

      if (hours >= 18 && attendanceStatus === 'IN') {
        checkOutApi()
        setAttendanceStatus('OUT')
        toast.info('Auto checked-out at 6 PM')
      }
    }, 60000) // check every 1 min

    return () => clearInterval(interval)
  }, [attendanceStatus])

  // ✅ AUTO LOGOUT AT 12 AM
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date()
      const hours = now.getHours()
      const minutes = now.getMinutes()

      if (hours === 0 && minutes === 0) {
        handleLogout()
      }
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-lightbg font-jakarta text-navy">
      <nav className="bg-white border-b border-line flex items-center justify-between px-4 lg:px-8 h-[60px] sticky top-0 z-50">

        {/* LEFT */}
        <div className='flex items-center gap-5 text-xl font-bold'>
           <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-text overflow-hidden">
                <img src={welcomeLogo} alt="Admin Logo" className=" w-10 h-10" />
              </span>
              <span>Intern Portal</span>
        </div>
        {/* RIGHT */}
        <div className="flex items-center gap-5">

          {/* ✅ CHECK IN / OUT BUTTON */}
          <Button
            type={attendanceStatus === 'IN' ? 'default' : 'primary'}
            danger={attendanceStatus === 'IN'}
            loading={attendanceLoading}
            onClick={handleAttendance}
          >
            {attendanceStatus === 'IN' ? 'Check Out' : 'Check In'}
          </Button>

          {/* USER */}
         <div className="w-8 h-8 rounded-full bg-ainfo flex items-center justify-center text-xs font-bold text-abg flex-shrink-0 shadow-[0_0_6px_#3dba78]">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-black font-syne truncate">{user.name}</p>
                  <p className="text-xs text-amuted font-mono truncate">{user.email}</p>
                </div>

          {/* LOGOUT */}
          <Button loading={loggingOut} onClick={handleLogout}>
            Logout
          </Button>

        </div>
      </nav>

      <main>
        <Outlet />
      </main>
    </div>
  )
}

export default InternLayout