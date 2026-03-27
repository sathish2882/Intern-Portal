import { useEffect, useState } from 'react'
import { getAllEmails, batchemailHistory } from '../../services/adminApi'

interface EmailItem {
  id: number
  receiver_name: string
  receiver_email: string
  amount: number
  created_at: string
  is_complete: boolean
}

const STATUS_CLASSES: Record<string, string> = {
  Sent: 'bg-asuccess/10 text-asuccess border border-asuccess/25',
  Pending: 'bg-gold/10 text-gold border border-gold/25',
  Failed: 'bg-adanger/10 text-adanger border border-adanger/25',
}

const EmailHistory = () => {
  const [search, setSearch] = useState('')
  const [data, setData] = useState<EmailItem[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [batchId, setBatchId] = useState<number | 'all'>('all')

  const fetchEmails = async (pageNo = 1) => {
    try {
      setLoading(true)

      let res

      if (batchId === 'all') {
        res = await getAllEmails({
          page_no: pageNo,
          page_size: 10,
        })
      } else {
        res = await batchemailHistory(batchId, {
          page_no: pageNo,
          page_size: 10,
        })
      }

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
  }, [page, batchId])

  const filtered = data.filter(
    (h) =>
      h.receiver_name?.toLowerCase().includes(search.toLowerCase()) ||
      h.receiver_email?.toLowerCase().includes(search.toLowerCase())
  )

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })

  const getStatus = (item: EmailItem) => {
    return item.is_complete ? 'Sent' : 'Pending'
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

        {/* Dropdown */}
        <select
          value={batchId}
          onChange={(e) => {
            const value = e.target.value === 'all' ? 'all' : Number(e.target.value)
            setBatchId(value)
            setPage(1)
          }}
          className="bg-abg2 border border-white/[0.07] rounded-[10px] px-3 py-2 text-sm text-adark"
        >
          <option value="all">All</option>
          <option value={1}>Batch 1</option>
          <option value={2}>Batch 2</option>
          <option value={3}>Batch 3</option>
          <option value={4}>Batch 4</option>
        </select>
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
                      #{String(index + 1 + (page - 1) * 10).padStart(4, '0')}
                    </td>

                    <td className="px-5 py-3">
                      <p className="font-semibold">{row.receiver_name}</p>
                      <p className="text-xs text-amuted">{row.receiver_email}</p>
                    </td>

                    <td className="px-5 py-3">
                      <span className="text-[11px] px-2 py-0.5 rounded-lg bg-ainfo/10 text-ainfo">
                        EMAIL
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
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1 text-xs bg-abg3 rounded disabled:opacity-50"
            >
              Prev
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`px-3 py-1 text-xs rounded ${
                  page === p
                    ? 'bg-gold text-black'
                    : 'bg-abg3 hover:bg-abg4'
                }`}
              >
                {p}
              </button>
            ))}

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
