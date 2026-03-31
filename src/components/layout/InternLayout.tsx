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

  // ✅ Load attendance status from localStorage (FIX)
  useEffect(() => {
    const savedStatus = localStorage.getItem('attendanceStatus')
    if (savedStatus === 'IN' || savedStatus === 'OUT') {
      setAttendanceStatus(savedStatus)
    }
  }, [])

  // ✅ Load Profile
  useEffect(() => {
    let mounted = true

    const loadProfile = async () => {
      try {
        const res = await getMeApi()
        if (mounted) {
          setProfile(res.data)

          // 🔥 If backend gives status → use this instead of localStorage
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

  // ✅ Check-In / Check-Out
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
      localStorage.removeItem('attendanceStatus') //
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
        localStorage.setItem('attendanceStatus', 'OUT') // ✅ SAVE
        toast.info('Auto checked-out at 6 PM')
      }
    }, 60000)

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
            <img src={welcomeLogo} alt="Logo" className="w-10 h-10" />
          </span>
          <span>Intern Portal</span>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-5">

          {/* ✅ CHECK IN / OUT */}
          <Button
            type={attendanceStatus === 'IN' ? 'default' : 'primary'}
            danger={attendanceStatus === 'IN'}
            loading={attendanceLoading}
            onClick={handleAttendance}
          >
            {attendanceStatus === 'IN' ? 'Check Out' : 'Check In'}
          </Button>

          {/* USER */}
          <div className="flex items-center gap-2 min-w-[120px]">
            {loadingProfile ? (
              <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
            ) : (
              <>
                <div className="w-8 h-8 rounded-full bg-ainfo flex items-center justify-center text-xs font-bold text-white">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-semibold">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </>
            )}
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