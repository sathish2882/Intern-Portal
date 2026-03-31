import { useEffect, useMemo, useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Button } from 'antd'

import { removeToken, removeUserType } from '../../utils/authCookies'
import { getMeApi, logoutApi } from '../../services/authApi'
import {
  checkInApi,
  checkOutApi,
  userStatusApi,
} from '../../services/attendanceApi'

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
  const [profile, setProfile] = useState<CurrentUserProfile | null>(null)

  const [attendanceStatus, setAttendanceStatus] = useState<'IN' | 'OUT'>('OUT')
  const [attendanceLoading, setAttendanceLoading] = useState(false)

  //  Scroll to top
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  //  Load attendance status from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('attendanceStatus')
    if (saved === 'IN' || saved === 'OUT') {
      setAttendanceStatus(saved)
    }
  }, [])

  //  Load Profile
  useEffect(() => {
    const load = async () => {
      try {
        const res = await getMeApi()
        setProfile(res.data)
      } catch (err: any) {
        toast.error(err?.response?.data?.detail || 'Failed to load profile')
      }
    }
    load()
  }, [])

  const user = useMemo(() => {
    if (!profile) return FALLBACK_USER
    return {
      name: capitalizeName(profile.username || FALLBACK_USER.name),
      email: profile.email || FALLBACK_USER.email,
    }
  }, [profile])

  //  Check-In / Check-Out
  const handleAttendance = async () => {
    if (attendanceLoading) return

    setAttendanceLoading(true)

    try {
      if (attendanceStatus === 'OUT') {
        await checkInApi()
        setAttendanceStatus('IN')
        localStorage.setItem('attendanceStatus', 'IN')
        window.dispatchEvent(new Event('attendanceUpdated'))
        toast.success('Checked in successfully')
      } else {
        await checkOutApi()
        setAttendanceStatus('OUT')
        localStorage.setItem('attendanceStatus', 'OUT')
        window.dispatchEvent(new Event('attendanceUpdated'))
        toast.success('Checked out successfully')
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Attendance failed')
    } finally {
      setAttendanceLoading(false)
    }
  }

  //  Logout (with safe checkout)
  const handleLogout = async () => {
    if (loggingOut) return
    setLoggingOut(true)

    try {
      if (attendanceStatus === 'IN') {
        await checkOutApi()
        localStorage.setItem('attendanceStatus', 'OUT')
      }

      await logoutApi()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Logout failed')
    } finally {
      removeToken()
      removeUserType()
      localStorage.removeItem('attendanceStatus')
      toast.success('Logged out successfully')
      navigate('/login', { replace: true })
      setLoggingOut(false)
    }
  }
     //  INACTIVITY + BACKEND SYNC
 useEffect(() => {
  let lastPing = Date.now()

  const handleActivity = async () => {
    const now = Date.now()

    // ping backend every 1 min
    if (now - lastPing > 5000) {
      lastPing = now

      try {
       const response = await userStatusApi()
         console.log(response) // tells backend "user is active"
      } catch (err) {
        console.error('user_status failed', err)
      }
    }
  }

  const handleVisibility = () => {
    if (document.visibilityState === 'visible') {
      handleActivity()
    }
  }

  window.addEventListener('mousemove', handleActivity)
  window.addEventListener('keydown', handleActivity)
  window.addEventListener('click', handleActivity)
  window.addEventListener('scroll', handleActivity)
  document.addEventListener('visibilitychange', handleVisibility)

  return () => {
    window.removeEventListener('mousemove', handleActivity)
    window.removeEventListener('keydown', handleActivity)
    window.removeEventListener('click', handleActivity)
    window.removeEventListener('scroll', handleActivity)
    document.removeEventListener('visibilitychange', handleVisibility)
  }
}, [])

  return (
    <div className="min-h-screen bg-lightbg font-jakarta text-navy">
      <nav className="bg-white border-b border-line flex items-center justify-between px-4 lg:px-8 h-[60px]">

        {/* LEFT */}
        <div className="flex items-center gap-4 font-bold text-lg">
          <img src={welcomeLogo} className="w-10 h-10 rounded" />
          Intern Portal
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-4">

          <Button
            type={attendanceStatus === 'IN' ? 'default' : 'primary'}
            danger={attendanceStatus === 'IN'}
            loading={attendanceLoading}
            onClick={handleAttendance}
          >
            {attendanceStatus === 'IN' ? 'Check Out' : 'Check In'}
          </Button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue text-white flex items-center justify-center text-xs font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-semibold">{user.name}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
          </div>

          <Button
            loading={loggingOut}
            disabled={attendanceLoading}
            onClick={handleLogout}
          >
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