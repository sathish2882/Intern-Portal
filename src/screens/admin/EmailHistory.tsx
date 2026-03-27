import { useState } from 'react'
import { EmailType } from '../../types'

const MOCK_HISTORY = [
  { id: 1, recipient: 'Arjun Sharma',  email: 'arjun@example.com',   type: 'invoice'      as EmailType, amount: '₹12,500', date: '25 Mar 2026', status: 'Sent'    },
  { id: 2, recipient: 'Priya Menon',   email: 'priya@example.com',   type: 'reminder'     as EmailType, amount: '₹8,200',  date: '24 Mar 2026', status: 'Sent'    },
  { id: 3, recipient: 'Rahul Verma',   email: 'rahul@example.com',   type: 'confirmation' as EmailType, amount: '₹5,000',  date: '23 Mar 2026', status: 'Pending' },
  { id: 4, recipient: 'Sneha Patel',   email: 'sneha@example.com',   type: 'renewal'      as EmailType, amount: '₹15,000', date: '22 Mar 2026', status: 'Failed'  },
  { id: 5, recipient: 'Karthik R',     email: 'karthik@example.com', type: 'invoice'      as EmailType, amount: '₹22,000', date: '21 Mar 2026', status: 'Sent'    },
  { id: 6, recipient: 'Deepa S',       email: 'deepa@example.com',   type: 'reminder'     as EmailType, amount: '₹6,800',  date: '20 Mar 2026', status: 'Sent'    },
  { id: 7, recipient: 'Vijay Kumar',   email: 'vijay@example.com',   type: 'confirmation' as EmailType, amount: '₹9,400',  date: '19 Mar 2026', status: 'Sent'    },
]

const STATUS_CLASSES: Record<string, string> = {
  Sent:    'bg-asuccess/10 text-asuccess border border-asuccess/25',
  Pending: 'bg-gold/10 text-gold border border-gold/25',
  Failed:  'bg-adanger/10 text-adanger border border-adanger/25',
}

const TYPE_CLASSES: Record<EmailType, string> = {
  invoice:      'bg-gold/10 text-gold',
  reminder:     'bg-ainfo/10 text-ainfo',
  confirmation: 'bg-asuccess/10 text-asuccess',
  renewal:      'bg-adanger/10 text-adanger',
}

const EmailHistory = () => {
  const [search, setSearch] = useState('')

  const filtered = MOCK_HISTORY.filter(
    (h) =>
      h.recipient.toLowerCase().includes(search.toLowerCase()) ||
      h.email.toLowerCase().includes(search.toLowerCase()) ||
      h.type.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className=" text-adark">
      <h1 className="text-2xl font-extrabold text-adark mb-1">Email History</h1>
      <p className="text-sm text-amuted mb-7">Track all payment emails sent from this portal.</p>

      {/* Search */}
      <div className="relative max-w-sm mb-4">
        <input
          placeholder="Search emails..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-abg2 border border-white/[0.07] rounded-[10px] pl-9 pr-4 py-2.5 text-sm text-adark outline-none focus:border-gold placeholder:text-amuted2"
        />
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-amuted" width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
          <path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
        </svg>
      </div>

      {/* Table */}
      <div className="bg-abg2 border border-white/[0.07] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.07]">
                {['#', 'Recipient', 'Type', 'Amount', 'Date', 'Status'].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-[11px] font-mono uppercase tracking-[0.06em] text-amuted font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-amuted">
                    No email history found.
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.id} className="border-b border-white/[0.04] hover:bg-abg3 transition-colors">
                    <td className="px-5 py-3.5 align-middle text-amuted2 text-xs">
                      #{String(row.id).padStart(4, '0')}
                    </td>
                    <td className="px-5 py-3.5 align-middle">
                      <p className="font-semibold text-adark leading-none">{row.recipient}</p>
                      <p className="text-xs text-amuted mt-0.5">{row.email}</p>
                    </td>
                    <td className="px-5 py-3.5 align-middle">
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg capitalize ${TYPE_CLASSES[row.type]}`}>
                        {row.type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 align-middle text-adark">{row.amount}</td>
                    <td className="px-5 py-3.5 align-middle text-amuted">{row.date}</td>
                    <td className="px-5 py-3.5 align-middle">
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${STATUS_CLASSES[row.status]}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-white/[0.07] flex items-center justify-between">
          <p className="text-xs text-amuted">
            Showing {filtered.length} of {MOCK_HISTORY.length} records
          </p>
        </div>
      </div>
    </div>
  )
}

export default EmailHistory
