import { useAppSelector } from '../../redux/hooks'


const user = {
  name: "Sathish",
  email: "sathish19222978sk@gmail.com"
}

const RECENT_EMAILS = [
  { recipient: 'Arjun Sharma',  email: 'arjun@example.com',   type: 'Invoice',      amount: '₹12,500', date: '25 Mar 2026', status: 'Sent'    },
  { recipient: 'Priya Menon',   email: 'priya@example.com',   type: 'Reminder',     amount: '₹8,200',  date: '24 Mar 2026', status: 'Sent'    },
  { recipient: 'Rahul Verma',   email: 'rahul@example.com',   type: 'Confirmation', amount: '₹5,000',  date: '23 Mar 2026', status: 'Pending' },
  { recipient: 'Sneha Patel',   email: 'sneha@example.com',   type: 'Renewal',      amount: '₹15,000', date: '22 Mar 2026', status: 'Failed'  },
  { recipient: 'Karthik R',     email: 'karthik@example.com', type: 'Invoice',      amount: '₹22,000', date: '21 Mar 2026', status: 'Sent'    },
]

const TYPE_BREAKDOWN = [
  { type: 'Invoice',      count: 542, pct: 42, colorClass: 'bg-gold'     },
  { type: 'Reminder',     count: 385, pct: 30, colorClass: 'bg-ainfo'    },
  { type: 'Confirmation', count: 230, pct: 18, colorClass: 'bg-asuccess' },
  { type: 'Renewal',      count: 127, pct: 10, colorClass: 'bg-adanger'  },
]

const STATUS_CLASSES: Record<string, string> = {
  Sent:    'bg-asuccess/10 text-asuccess border border-asuccess/25',
  Pending: 'bg-gold/10 text-gold border border-gold/25',
  Failed:  'bg-adanger/10 text-adanger border border-adanger/25',
}

const AdminDashboard = () => {

  const STATS = [
    { label: 'Total Sent',  value: '1,284', change: '+12% this month',  valueClass: 'text-gold'     },
    { label: 'This Month',  value: '148',   change: '+8% vs last month', valueClass: 'text-asuccess' },
    { label: 'Pending',     value: '12',    change: 'Action needed',     valueClass: 'text-gold'     },
    { label: 'Failed',      value: '3',     change: 'Retry required',    valueClass: 'text-adanger'  },
  ]

  return (
    <div className="font-syne text-adark">
      {/* Page header */}
      <h1 className="text-2xl font-extrabold text-adark mb-1">Dashboard</h1>
      <p className="text-sm text-amuted mb-7">
        Good day, {user?.name ?? 'Admin'} 👋 — Here's your email overview.
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
        {STATS.map((s) => (
          <div key={s.label} className="bg-abg2 border border-white/[0.07] rounded-2xl p-4 lg:p-5">
            <p className="text-[11px] text-amuted font-mono uppercase tracking-[0.07em] mb-2">{s.label}</p>
            <p className={`text-3xl font-bold font-mono ${s.valueClass}`}>{s.value}</p>
            <p className="text-xs text-asuccess mt-1.5">{s.change}</p>
          </div>
        ))}
      </div>

      {/* Two column */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Recent emails */}
        <div className="xl:col-span-2 bg-abg2 border border-white/[0.07] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.07]">
            <h2 className="text-sm font-bold text-adark">Recent Emails</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="border-b border-white/[0.07]">
                  {['Recipient', 'Type', 'Amount', 'Date', 'Status'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-[11px] font-mono uppercase tracking-[0.06em] text-amuted font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {RECENT_EMAILS.map((row, i) => (
                  <tr key={i} className="border-b border-white/[0.04] hover:bg-abg3 transition-colors">
                    <td className="px-4 py-3 align-middle">
                      <p className="font-semibold text-adark leading-none">{row.recipient}</p>
                      <p className="text-xs text-amuted mt-0.5">{row.email}</p>
                    </td>
                    <td className="px-4 py-3 align-middle text-amuted">{row.type}</td>
                    <td className="px-4 py-3 align-middle font-mono text-adark">{row.amount}</td>
                    <td className="px-4 py-3 align-middle text-amuted">{row.date}</td>
                    <td className="px-4 py-3 align-middle">
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full font-mono ${STATUS_CLASSES[row.status]}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Type breakdown */}
        <div className="bg-abg2 border border-white/[0.07] rounded-2xl p-5">
          <h2 className="text-sm font-bold text-adark mb-5">Email Type Breakdown</h2>
          <div className="space-y-5">
            {TYPE_BREAKDOWN.map((t) => (
              <div key={t.type}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm font-semibold text-adark">{t.type}</span>
                  <span className="text-xs font-mono text-amuted">{t.count}</span>
                </div>
                <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-700 ${t.colorClass}`} style={{ width: `${t.pct}%` }} />
                </div>
                <p className="text-[11px] text-amuted mt-1 font-mono">{t.pct}%</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

export default AdminDashboard
