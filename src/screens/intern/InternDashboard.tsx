import { useMemo, useState } from 'react'
import { toast } from 'react-toastify'

interface AttendanceEntry {
  date: string
  checkIn: string | null
  checkOut: string | null
  status: 'Checked In' | 'Completed'
}

const STORAGE_KEY = 'intern_attendance_history'

const getTodayKey = () => new Date().toISOString().slice(0, 10)
const getTimeLabel = () =>
  new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })

const getStoredHistory = (): AttendanceEntry[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as AttendanceEntry[]) : []
  } catch {
    return []
  }
}

const InternDashboard = () => {
  const [history, setHistory] = useState<AttendanceEntry[]>(getStoredHistory)

  const todayKey = getTodayKey()
  const todayEntry = history.find((entry) => entry.date === todayKey)

  const presentDays = useMemo(
    () => history.filter((entry) => entry.checkIn).length,
    [history],
  )

  const updateHistory = (nextHistory: AttendanceEntry[]) => {
    setHistory(nextHistory)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextHistory))
  }

  const handleCheckIn = () => {
    if (todayEntry?.checkIn) {
      toast.info('You have already checked in today')
      return
    }

    const entry: AttendanceEntry = {
      date: todayKey,
      checkIn: getTimeLabel(),
      checkOut: null,
      status: 'Checked In',
    }

    updateHistory([entry, ...history])
    toast.success('Checked in successfully')
  }

  const handleCheckOut = () => {
    if (!todayEntry?.checkIn) {
      toast.error('Please check in first')
      return
    }

    if (todayEntry.checkOut) {
      toast.info('You have already checked out today')
      return
    }

    updateHistory(
      history.map((entry) =>
        entry.date === todayKey
          ? {
              ...entry,
              checkOut: getTimeLabel(),
              status: 'Completed',
            }
          : entry,
      ),
    )
    toast.success('Checked out successfully')
  }

  return (
    <div className="max-w-[1160px] mx-auto px-4 lg:px-8 py-8 font-jakarta text-navy animate-fadeUp">
      <p className="text-xs text-mist font-mono mb-6">
        Intern Portal › <span className="text-blue">Attendance Dashboard</span>
      </p>

      <div className="mb-7">
        <h1 className="text-2xl font-extrabold text-navy tracking-tight mb-1">
          Attendance Dashboard
        </h1>
        <p className="text-sm text-slate">
          Check in, check out, and review your attendance history.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4 mb-6">
        <div className="bg-white border border-line rounded-xl p-4 lg:p-5">
          <p className="text-xs text-slate mb-1">Today Status</p>
          <p className="text-2xl font-extrabold text-navy">
            {todayEntry ? todayEntry.status : 'Not Marked'}
          </p>
        </div>
        <div className="bg-white border border-line rounded-xl p-4 lg:p-5">
          <p className="text-xs text-slate mb-1">Check In</p>
          <p className="text-2xl font-extrabold text-navy">
            {todayEntry?.checkIn ?? '--:--'}
          </p>
        </div>
        <div className="bg-white border border-line rounded-xl p-4 lg:p-5">
          <p className="text-xs text-slate mb-1">Present Days</p>
          <p className="text-2xl font-extrabold text-navy">{presentDays}</p>
        </div>
      </div>

      <div className="bg-white border border-line rounded-[13px] p-5 mb-6">
        <p className="text-sm font-extrabold text-navy mb-4">Today Actions</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleCheckIn}
            disabled={Boolean(todayEntry?.checkIn)}
            className="flex-1 bg-blue hover:bg-bluelt text-white font-bold py-3 rounded-[9px] text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Check In
          </button>
          <button
            onClick={handleCheckOut}
            disabled={!todayEntry?.checkIn || Boolean(todayEntry?.checkOut)}
            className="flex-1 bg-white border-[1.5px] border-line hover:border-blue hover:text-blue text-slate font-bold py-3 rounded-[9px] text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Check Out
          </button>
        </div>
      </div>

      <div className="bg-white border border-line rounded-[13px] overflow-hidden">
        <div className="px-5 py-4 border-b border-line">
          <span className="text-sm font-extrabold text-navy">Attendance History</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line">
                {['Date', 'Check In', 'Check Out', 'Status'].map((heading) => (
                  <th
                    key={heading}
                    className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-[0.5px] text-mist"
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
                  <tr key={entry.date} className="border-b border-line last:border-b-0">
                    <td className="px-5 py-3.5">{entry.date}</td>
                    <td className="px-5 py-3.5">{entry.checkIn ?? '--:--'}</td>
                    <td className="px-5 py-3.5">{entry.checkOut ?? '--:--'}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                          entry.status === 'Completed'
                            ? 'bg-[#ecfdf5] text-asuccess'
                            : 'bg-sky text-blue'
                        }`}
                      >
                        {entry.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default InternDashboard
