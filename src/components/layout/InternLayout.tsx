import { useEffect, useMemo, useState, useRef } from 'react'
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

  const lastPingRef = useRef(0)

  // ✅ Scroll to top
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  // ✅ Load attendance status from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('attendanceStatus')
    if (saved === 'IN' || saved === 'OUT') {
      setAttendanceStatus(saved)
    }
  }, [])

  // ✅ Load Profile
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

  // ✅ Check-In / Check-Out (Manual)
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

  // ✅ Logout (safe checkout)
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

  // 🔥 BACKEND-DRIVEN ACTIVITY + AUTO CHECKOUT
  useEffect(() => {
    const handleActivity = async () => {
      if (attendanceStatus !== 'IN') return

      const now = Date.now()

      // ⏱️ call API every 5 sec
      if (now - lastPingRef.current > 5000) {
        lastPingRef.current = now

        try {
          const response = await userStatusApi()
          const data = response?.data

          console.log('API CALLED', data)

          //  ACTIVE → do nothing
          if (data === 'time_added') return

          //  AUTO CHECKOUT FROM BACKEND
          if (data === 'time_out' && attendanceStatus === 'IN') {
            setAttendanceStatus('OUT')
            localStorage.setItem('attendanceStatus', 'OUT')

            window.dispatchEvent(new Event('attendanceUpdated'))

            toast.info('Auto checked-out due to inactivity')
          }

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

    // ✅ Activity listeners
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
  }, [attendanceStatus])

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

          {/* CHECK IN / OUT */}
          <Button
            type={attendanceStatus === 'IN' ? 'default' : 'primary'}
            danger={attendanceStatus === 'IN'}
            loading={attendanceLoading}
            onClick={handleAttendance}
          >
            {attendanceStatus === 'IN' ? 'Check Out' : 'Check In'}
          </Button>

          {/* USER */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue text-white flex items-center justify-center text-xs font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-semibold">{user.name}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
          </div>

          {/* LOGOUT */}
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
