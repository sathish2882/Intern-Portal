import AdminPortalShell from '../../components/layout/AdminPortalShell'

const USER_STATS = [
  { label: 'Registered Users', value: '128', hint: 'Across all current batches' },
  { label: 'Active Interns', value: '96', hint: 'Currently engaged this week' },
  { label: 'Pending Reviews', value: '14', hint: 'Need admin follow-up' },
  { label: 'Completion Rate', value: '87%', hint: 'Current assessment cycle' },
]

const USER_ROWS = [
  { name: 'Arjun Sharma', domain: 'Frontend', stage: 'Technical Test', status: 'Active' },
  { name: 'Priya Menon', domain: 'Backend', stage: 'Completed', status: 'Active' },
  { name: 'Rahul Verma', domain: 'QA', stage: 'Aptitude Test', status: 'Pending' },
  { name: 'Sneha Patel', domain: 'UI/UX', stage: 'Interview Round', status: 'Active' },
  { name: 'Karthik R', domain: 'Data', stage: 'Completed', status: 'Selected' },
]

const STATUS_CLASSES: Record<string, string> = {
  Active: 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/20',
  Pending: 'bg-amber-500/15 text-amber-300 border border-amber-400/20',
  Selected: 'bg-sky-500/15 text-sky-300 border border-sky-400/20',
}

const AdminUserDashboard = () => {
  return (
    <AdminPortalShell
      title="User Dashboard"
      subtitle="Overview of registered interns, current progress, and engagement status."
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {USER_STATS.map((card) => (
          <div key={card.label} className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400 mb-2">{card.label}</p>
            <p className="text-3xl font-extrabold">{card.value}</p>
            <p className="text-xs text-slate-400 mt-2">{card.hint}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10">
          <h2 className="text-sm font-bold">User Progress Snapshot</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                {['Name', 'Domain', 'Current Stage', 'Status'].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-[11px] uppercase tracking-[0.14em] text-slate-400 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {USER_ROWS.map((row) => (
                <tr key={row.name} className="border-b border-white/5 last:border-b-0">
                  <td className="px-5 py-4 font-semibold">{row.name}</td>
                  <td className="px-5 py-4 text-slate-300">{row.domain}</td>
                  <td className="px-5 py-4 text-slate-300">{row.stage}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_CLASSES[row.status]}`}>
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

export default AdminUserDashboard
