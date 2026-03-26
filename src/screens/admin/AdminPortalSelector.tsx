import { useNavigate } from 'react-router-dom'
import AdminPortalShell from '../../components/layout/AdminPortalShell'

const PORTALS = [
  {
    title: 'Payment Dashboard',
    description: 'Open the existing payment dashboard with send email, customers, and email history.',
    route: '/admin/payment/dashboard',
    accent: 'border-fuchsia-400/20 bg-fuchsia-500/10',
  },
  {
    title: 'User Dashboard',
    description: 'Open the admin-facing user overview dashboard.',
    route: '/admin/user-dashboard',
    accent: 'border-sky-400/20 bg-red-500/10',
  },
  {
    title: 'User Attendance Dashboard',
    description: 'View attendance summary, late check-ins, and consistency metrics.',
    route: '/admin/attendance-dashboard',
    accent: 'border-emerald-400/20 bg-emerald-500/10',
  },
  {
    title: 'User Exam Dashboard',
    description: 'Review aptitude and technical marks across assessed users.',
    route: '/admin/exam-dashboard',
    accent: 'border-amber-400/20 bg-amber-500/10',
  },
]

const AdminPortalSelector = () => {
  const navigate = useNavigate()

  return (
    <AdminPortalShell
      title="Admin Dashboards"
      subtitle="Choose the dashboard you want to open after login."
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        {PORTALS.map((portal) => (
          <button
            key={portal.route}
            onClick={() => navigate(portal.route)}
            className={`text-left rounded-2xl border p-6 transition-all hover:-translate-y-0.5 hover:bg-white/10 ${portal.accent}`}
          >
            <p className="text-lg font-bold mb-2">{portal.title}</p>
            <p className="text-sm text-slate-300 leading-6 mb-6">{portal.description}</p>
            <span className="inline-flex items-center text-sm font-semibold text-sky-300">
              Open Dashboard
            </span>
          </button>
        ))}
      </div>
    </AdminPortalShell>
  )
}

export default AdminPortalSelector
