import { useEffect, useState } from 'react'
import { emailHistory } from '../../services/adminApi'

interface EmailItem {
  id: number
  receiver_name: string
  receiver_email: string
  email_type: number | string
  amount: number
  created_at: string
  is_complete: boolean
}

const STATUS_CLASSES: Record<string, string> = {
  Sent: 'bg-asuccess/10 text-asuccess border border-asuccess/25',
  Pending: 'bg-gold/10 text-gold border border-gold/25',
  Failed: 'bg-adanger/10 text-adanger border border-adanger/25',
}

const TYPE_CLASSES: Record<string, string> = {
  INVOICE: 'bg-gold/10 text-gold',
  REMAINDER: 'bg-ainfo/10 text-ainfo',
  CONFIRMATION: 'bg-asuccess/10 text-asuccess',
  RENEWAL: 'bg-adanger/10 text-adanger',
}

const EMAIL_TYPE_LABEL: Record<string, string> = {
  '1': 'INVOICE',
  '2': 'REMAINDER',
  '3': 'CONFIRMATION',
}

const getEmailTypeLabel = (value: number | string) => {
  const rawValue = String(value)
  return EMAIL_TYPE_LABEL[rawValue] ?? rawValue.toUpperCase()
}

const formatEmailType = (value: number | string) =>
  getEmailTypeLabel(value)
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())

const EmailHistory = () => {
  const [search, setSearch] = useState('')
  const [data, setData] = useState<EmailItem[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)

  const fetchEmails = async (pageNo = 1) => {
    try {
      setLoading(true)
      const res = await emailHistory({
        params: { page_no: pageNo, page_size: 10 },
      })

      const result = res.data

      setData(result.data)
      setTotalPages(result.total_pages)
      setPage(result.current_page)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

 useEffect(() => {
  fetchEmails(page)
}, [page])

  const filtered = data.filter(
    (h) =>
      h.receiver_name?.toLowerCase().includes(search.toLowerCase()) ||
      h.receiver_email?.toLowerCase().includes(search.toLowerCase()) ||
      formatEmailType(h.email_type).toLowerCase().includes(search.toLowerCase())
  )

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })

  const getStatus = (item: EmailItem) => {
    if (item.is_complete) return 'Sent'
    return 'Pending'
  }

  return (
    <div className="text-adark">
      <h1 className="text-2xl font-extrabold text-adark mb-1">Email History</h1>
      <p className="text-sm text-amuted mb-7">
        Track all payment emails sent from this portal.
      </p>

      {/* Search + Dropdown */}
      <div className="flex gap-3 mb-4 justify-between">
        <div className="relative max-w-sm w-full">
          <input
            placeholder="Search emails..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-abg2 border border-white/[0.07] rounded-[10px] pl-9 pr-4 py-2.5 text-sm text-adark outline-none focus:border-gold placeholder:text-amuted2"
          />
        </div>
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
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-amuted">
                    Loading...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-amuted">
                    No data found
                  </td>
                </tr>
              ) : (
                filtered.map((row, index) => (
                  <tr key={index} className="border-b border-white/[0.04] hover:bg-abg3">
                    <td className="px-5 py-3 text-xs text-amuted2">
                      #{String(index + 1).padStart(4, '0')}
                    </td>

                    <td className="px-5 py-3">
                      <p className="font-semibold">{row.receiver_name}</p>
                      <p className="text-xs text-amuted">{row.receiver_email}</p>
                    </td>

                    <td className="px-5 py-3">
                      <span className={`text-[11px] px-2 py-0.5 rounded-lg ${TYPE_CLASSES[getEmailTypeLabel(row.email_type)] ?? 'bg-white/10 text-adark'}`}>
                        {formatEmailType(row.email_type)}
                      </span>
                    </td>

                    <td className="px-5 py-3">₹{row.amount}</td>

                    <td className="px-5 py-3 text-amuted">
                      {formatDate(row.created_at)}
                    </td>

                    <td className="px-5 py-3">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full ${STATUS_CLASSES[getStatus(row)]}`}>
                        {getStatus(row)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-5 py-3 border-t border-white/[0.07] flex justify-between items-center">
          <p className="text-xs text-amuted">
            Page {page} of {totalPages}
          </p>

          <div className="flex gap-2 items-center">
            {/* Prev */}
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1 text-xs bg-abg3 rounded disabled:opacity-50"
            >
              Prev
            </button>

            {/* Page Numbers */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`px-3 py-1 text-xs rounded ${page === p
                    ? 'bg-gold text-black'
                    : 'bg-abg3 hover:bg-abg4'
                  }`}
              >
                {p}
              </button>
            ))}

            {/* Next */}
            <button
              disabled={page === totalPages}
             onClick={() => setPage(page + 1)}
              className="px-3 py-1 text-xs bg-abg3 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmailHistory
