import { useMemo, useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { viewAttendanceByUserApi } from '../../services/adminApi'

interface AttendanceEntry {
  date: string
  first_login: string | null
  last_logout: string | null
  productive_minutes: number
}

interface ApiAttendanceResponse {
  date: string
  first_login: string
  last_logout: string
  productive_minutes: number
}

const getTodayKey = () => new Date().toISOString().slice(0, 10)

const formatTime = (isoString: string) => {
  try {
    // 👉 Force UTC by adding 'Z'
    const date = new Date(isoString + 'Z')

    return date.toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  } catch (error) {
    console.error('Time format error:', error)
    return '--:--'
  }
}

const InternDashboard = () => {
  const [history, setHistory] = useState<AttendanceEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setLoading(true)
        const response = await viewAttendanceByUserApi()
        const data = response.data as ApiAttendanceResponse[]
        setHistory(data || [])
        setError(null)
      } catch (err: any) {
        console.error('Failed to fetch attendance:', err)
        setError('Failed to load attendance history')
        toast.error('Failed to load attendance history')
      } finally {
        setLoading(false)
      }
    }

    fetchAttendance()
  }, [])

  const todayKey = getTodayKey()
  const todayEntry = history.find((entry) => entry.date === todayKey)

  const presentDays = useMemo(
    () => history.filter((entry) => entry.first_login).length,
    [history],
  )


  return (
    <div className="max-w-[1160px] mx-auto px-4 lg:px-8 py-8 font-jakarta text-navy animate-fadeUp">
      <p className="text-xs text-mist font-mono mb-6">
        Intern Portal <span className="text-blue">Attendance Dashboard</span>
      </p>

      <div className="mb-7">
        <h1 className="text-2xl font-extrabold text-navy tracking-tight mb-1">
          Attendance Dashboard
        </h1>
        <p className="text-sm text-slate">
          Check in, check out, and review your attendance history.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="loader" />
          <p className="text-sm text-slate mt-4 animate-pulse">Loading attendance data…</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      ) : (
      <>
      {/* KPI Cards — 4 separate cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
        {/* Login Time */}
        <div className="bg-white border border-line rounded-xl p-4 lg:p-5 transition-all hover:shadow-[0_6px_20px_rgba(0,0,0,0.07)] hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-2.5">
            <div className="w-9 h-9 bg-[#ecfdf5] rounded-[9px] flex items-center justify-center text-lg">
              <span className="text-asuccess">↗</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#ecfdf5] text-asuccess">In</span>
          </div>
          <p className="text-2xl font-extrabold text-navy tracking-tight">
            {todayEntry?.first_login ? formatTime(todayEntry.first_login) : '--:--'}
          </p>
          <p className="text-xs text-slate mt-0.5">Login Time</p>
        </div>

        {/* Logout Time */}
        <div className="bg-white border border-line rounded-xl p-4 lg:p-5 transition-all hover:shadow-[0_6px_20px_rgba(0,0,0,0.07)] hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-2.5">
            <div className="w-9 h-9 bg-[#fef2f2] rounded-[9px] flex items-center justify-center text-lg">
              <span className="text-[#dc2626]">↙</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#fef2f2] text-[#dc2626]">Out</span>
          </div>
          <p className="text-2xl font-extrabold text-navy tracking-tight">
            {todayEntry?.last_logout ? formatTime(todayEntry.last_logout) : '--:--'}
          </p>
          <p className="text-xs text-slate mt-0.5">Logout Time</p>
        </div>

        {/* Productive Minutes */}
        <div className="bg-white border border-line rounded-xl p-4 lg:p-5 transition-all hover:shadow-[0_6px_20px_rgba(0,0,0,0.07)] hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-2.5">
            <div className="w-9 h-9 bg-sky rounded-[9px] flex items-center justify-center text-lg">
              <span className="text-blue">⏱</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky text-blue">Today</span>
          </div>
          <p className="text-2xl font-extrabold text-navy tracking-tight">
            {todayEntry?.productive_minutes?.toFixed(0) ?? 0}<span className="text-sm font-bold text-slate ml-1">min</span>
          </p>
          <p className="text-xs text-slate mt-0.5">Productive Time</p>
        </div>

        {/* Present Days */}
        <div className="bg-white border border-line rounded-xl p-4 lg:p-5 transition-all hover:shadow-[0_6px_20px_rgba(0,0,0,0.07)] hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-2.5">
            <div className="w-9 h-9 bg-[#fff7ed] rounded-[9px] flex items-center justify-center text-lg">
              <span className="text-[#e07b00]">📅</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#fff7ed] text-[#e07b00]">Total</span>
          </div>
          <p className="text-2xl font-extrabold text-navy tracking-tight">{presentDays}</p>
          <p className="text-xs text-slate mt-0.5">Present Days</p>
        </div>
      </div>

      {/* Attendance History Table */}
      <div className="bg-white border border-line rounded-[13px] overflow-hidden">
        <div className="px-5 py-4 border-b border-line">
          <span className="text-sm font-extrabold text-navy">Attendance History</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line">
                {['Date', 'Login Time', 'Logout Time', 'Productive Minutes'].map((heading) => (
                  <th
                    key={heading}
                    className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-[0.5px] text-mist whitespace-nowrap"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-sm text-mist">
                    No attendance history yet.
                  </td>
                </tr>
              ) : (
                history.map((entry) => (
                  <tr key={entry.date} className="border-b border-line last:border-b-0 hover:bg-lightbg transition-colors">
                    <td className="px-5 py-3.5 font-medium">{entry.date}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-asuccess" />
                        {entry.first_login ? formatTime(entry.first_login) : '--:--'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#dc2626]" />
                        {entry.last_logout ? formatTime(entry.last_logout) : '--:--'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-blue">{entry.productive_minutes?.toFixed(0) ?? 0} min</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}
    </div>
  )
}

export default InternDashboard
