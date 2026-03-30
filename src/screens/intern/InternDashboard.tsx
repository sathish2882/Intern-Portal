import { useMemo, useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { viewAttendanceByUserApi } from '../../services/adminApi'

interface AttendanceEntry {
  date: string
  check_in: string | null
  check_out: string | null
  productive_minutes: number
}

const getTodayKey = () => new Date().toISOString().slice(0, 10)

const formatTime = (isoString: string) => {
  try {
    const date = new Date(isoString)

    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return '--:--'
  }
}

const InternDashboard = () => {
  const [history, setHistory] = useState<AttendanceEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ✅ FETCH ATTENDANCE
  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setLoading(true)

        const response = await viewAttendanceByUserApi()
        const raw = response.data as any[]

        // ✅ FIXED MAPPING
        const normalized: AttendanceEntry[] = Array.isArray(raw)
          ? raw.map((item) => ({
              date: item.date,
              check_in: item.check_in ?? null,
              check_out: item.check_out ?? null,
              productive_minutes: item.productive_minutes ?? 0,
            }))
          : []

        setHistory(normalized)
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
    () => history.filter((entry) => entry.check_in).length,
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
          <p className="text-sm text-slate mt-4 animate-pulse">
            Loading attendance data…
          </p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
            {/* Checkin */}
            <div className="bg-white border border-line rounded-xl p-4">
              <p className="text-2xl font-extrabold">
                {todayEntry?.check_in
                  ? formatTime(todayEntry.check_in)
                  : '--:--'}
              </p>
              <p className="text-xs text-slate">Checkin Time</p>
            </div>

            {/* Checkout */}
            <div className="bg-white border border-line rounded-xl p-4">
              <p className="text-2xl font-extrabold">
                {todayEntry?.check_out
                  ? formatTime(todayEntry.check_out)
                  : '--:--'}
              </p>
              <p className="text-xs text-slate">Checkout Time</p>
            </div>

            {/* Productive */}
            <div className="bg-white border border-line rounded-xl p-4">
              <p className="text-2xl font-extrabold">
                {todayEntry?.productive_minutes?.toFixed(0) ?? 0} min
              </p>
              <p className="text-xs text-slate">Productive Time</p>
            </div>

            {/* Present Days */}
            <div className="bg-white border border-line rounded-xl p-4">
              <p className="text-2xl font-extrabold">{presentDays}</p>
              <p className="text-xs text-slate">Present Days</p>
            </div>
          </div>

          {/* TABLE */}
          <div className="bg-white border border-line rounded-[13px] overflow-hidden">
            <div className="px-5 py-4 border-b border-line">
              <span className="text-sm font-extrabold text-navy">
                Attendance History
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line">
                    {[
                      'Date',
                      'Checkin Time',
                      'Checkout Time',
                      'Productive Minutes',
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="text-left px-5 py-3 text-[11px] font-bold text-mist"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {history.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-5 py-8 text-center text-sm text-mist"
                      >
                        No attendance history yet.
                      </td>
                    </tr>
                  ) : (
                    history.map((entry) => (
                      <tr key={entry.date} className="border-b border-line">
                        <td className="px-5 py-3.5">{entry.date}</td>
                        <td className="px-5 py-3.5">
                          {entry.check_in
                            ? formatTime(entry.check_in)
                            : '--:--'}
                        </td>
                        <td className="px-5 py-3.5">
                          {entry.check_out
                            ? formatTime(entry.check_out)
                            : '--:--'}
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-blue">
                          {entry.productive_minutes?.toFixed(0) ?? 0} min
                        </td>
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