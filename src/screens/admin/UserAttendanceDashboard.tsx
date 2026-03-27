import AdminPortalShell from '../../components/layout/AdminPortalShell'

const ATTENDANCE_STATS = [
  { label: 'Present Today', value: '84', hint: 'Out of 96 interns', valueClass: 'text-emerald-300' },
  { label: 'Absent Today', value: '12', hint: 'Needs follow-up', valueClass: 'text-red-300' },
  { label: 'Late Check-ins', value: '9', hint: 'After 9:30 AM', valueClass: 'text-amber-300' },
  { label: 'Avg. Attendance', value: '91%', hint: 'Current month', valueClass: 'text-sky-300' },
]

const ATTENDANCE_ROWS = [
  { name: 'Arjun Sharma', team: 'Frontend', status: 'Present', inTime: '09:03 AM', attendance: '96%' },
  { name: 'Priya Menon', team: 'Backend', status: 'Present', inTime: '09:11 AM', attendance: '94%' },
  { name: 'Rahul Verma', team: 'QA', status: 'Absent', inTime: '-', attendance: '82%' },
  { name: 'Sneha Patel', team: 'UI/UX', status: 'Late', inTime: '09:42 AM', attendance: '88%' },
  { name: 'Karthik R', team: 'Data', status: 'Present', inTime: '08:58 AM', attendance: '97%' },
]

const STATUS_CLASSES: Record<string, string> = {
  Present: 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/20',
  Absent: 'bg-red-500/15 text-red-300 border border-red-400/20',
  Late: 'bg-amber-500/15 text-amber-300 border border-amber-400/20',
}

const UserAttendanceDashboard = () => {
  return (
    <AdminPortalShell
      title="User Attendance Dashboard"
      subtitle="Monitor attendance, late arrivals, and monthly consistency."
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {ATTENDANCE_STATS.map((s) => (
          <div key={s.label} className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400 mb-2">{s.label}</p>
            <p className={`text-3xl font-extrabold ${s.valueClass}`}>{s.value}</p>
            <p className="text-xs text-slate-400 mt-2">{s.hint}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10">
          <h2 className="text-sm font-bold">Attendance Overview</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                {['Name', 'Team', 'Status', 'Check-in', 'Month %'].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-[11px] uppercase tracking-[0.14em] text-slate-400 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ATTENDANCE_ROWS.map((row) => (
                <tr key={row.name} className="border-b border-white/5 last:border-b-0">
                  <td className="px-5 py-4 font-semibold">{row.name}</td>
                  <td className="px-5 py-4 text-slate-300">{row.team}</td>
                  <td className="px-5 py-4">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${STATUS_CLASSES[row.status]}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-300">{row.inTime}</td>
                  <td className="px-5 py-4 font-mono">{row.attendance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminPortalShell>
  )
}

export default UserAttendanceDashboard;
