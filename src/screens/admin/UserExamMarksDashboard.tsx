import AdminPortalShell from '../../components/layout/AdminPortalShell'

const MARKS_STATS = [
  { label: 'Tests Evaluated', value: '96', hint: 'All submitted assessments', valueClass: 'text-amber-300' },
  { label: 'Aptitude Avg', value: '72%', hint: 'Batch average', valueClass: 'text-sky-300' },
  { label: 'Technical Avg', value: '68%', hint: 'Batch average', valueClass: 'text-emerald-300' },
  { label: 'Top Score', value: '94%', hint: 'Best combined mark', valueClass: 'text-amber-300' },
]

const MARKS_ROWS = [
  { name: 'Arjun Sharma', aptitude: '24/30', technical: '16/20', total: '80%', status: 'Qualified' },
  { name: 'Priya Menon', aptitude: '27/30', technical: '17/20', total: '88%', status: 'Qualified' },
  { name: 'Rahul Verma', aptitude: '15/30', technical: '10/20', total: '50%', status: 'Review' },
  { name: 'Sneha Patel', aptitude: '22/30', technical: '14/20', total: '72%', status: 'Qualified' },
  { name: 'Karthik R', aptitude: '28/30', technical: '19/20', total: '94%', status: 'Topper' },
]

const STATUS_CLASSES: Record<string, string> = {
  Qualified: 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/20',
  Review: 'bg-amber-500/15 text-amber-300 border border-amber-400/20',
  Topper: 'bg-sky-500/15 text-sky-300 border border-sky-400/20',
}

const UserExamMarksDashboard = () => {
  return (
    <AdminPortalShell
      title="User Exam Dashboard"
      subtitle="Review aptitude and technical scores for all assessed users."
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {MARKS_STATS.map((s) => (
          <div key={s.label} className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400 mb-2">{s.label}</p>
            <p className={`text-3xl font-extrabold ${s.valueClass}`}>{s.value}</p>
            <p className="text-xs text-slate-400 mt-2">{s.hint}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10">
          <h2 className="text-sm font-bold">Marks Overview</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                {['Name', 'Aptitude', 'Technical', 'Overall', 'Status'].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-[11px] uppercase tracking-[0.14em] text-slate-400 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MARKS_ROWS.map((row) => (
                <tr key={row.name} className="border-b border-white/5 last:border-b-0">
                  <td className="px-5 py-4 font-semibold">{row.name}</td>
                  <td className="px-5 py-4 font-mono">{row.aptitude}</td>
                  <td className="px-5 py-4 font-mono">{row.technical}</td>
                  <td className="px-5 py-4 font-mono">{row.total}</td>
                  <td className="px-5 py-4">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${STATUS_CLASSES[row.status]}`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminPortalShell>
  )
}

export default UserExamMarksDashboard
