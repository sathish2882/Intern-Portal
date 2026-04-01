import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { getBatchesApi, getDashboardApi } from '../../services/authApi'

interface BatchOption {
  id: number
  label: string
}

interface RecentMailItem {
  invoice_no: string
  to_id: number
  email_type: number | string
  amount: number
  due_date: string
  is_complete: boolean
  created_at: string
}

interface EmailTypeCountItem {
  email_type: number | string
  count: number
}

interface DashboardResponse {
  email_sent: number
  total_invoice: number
  active_customers: number
  overdue: number
  recent_mail: RecentMailItem[]
  email_type_count: EmailTypeCountItem[]
}

const EMPTY_DASHBOARD: DashboardResponse = {
  email_sent: 0,
  total_invoice: 0,
  active_customers: 0,
  overdue: 0,
  recent_mail: [],
  email_type_count: [],
}

const EMAIL_TYPE_COLOR: Record<string, string> = {
  INVOICE: 'bg-gold',
  REMAINDER: 'bg-ainfo',
  CONFIRMATION: 'bg-asuccess',
}

const EMAIL_TYPE_LABEL: Record<string, string> = {
  '1': 'INVOICE',
  '2': 'REMAINDER',
  '3': 'CONFIRMATION',
}

const toArray = (value: unknown) => {
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

const normalizeBatches = (payload: unknown): BatchOption[] => {
  return toArray(payload).map((item, index) => {
    if (typeof item === 'object' && item !== null) {
      const batch = item as Record<string, unknown>
      const rawId = Number(batch.id ?? batch.batch_id ?? batch.value ?? index + 1)
      const rawLabel =
        batch.name ??
        batch.batch_name ??
        batch.label ??
        batch.title ??
        `Batch ${rawId}`

      return {
        id: rawId,
        label: String(rawLabel),
      }
    }

    const rawId = Number(item)

    return {
      id: Number.isFinite(rawId) ? rawId : index + 1,
      label: `Batch ${String(item)}`,
    }
  })
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0)

const formatDate = (value: string) => {
  if (!value) return '-'

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value

  return parsed.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const getEmailTypeLabel = (value: number | string) => {
  const rawValue = String(value)
  return EMAIL_TYPE_LABEL[rawValue] ?? rawValue.toUpperCase()
}

const formatLabel = (value: number | string) =>
  getEmailTypeLabel(value)
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())

const normalizeRecentMail = (value: unknown): RecentMailItem[] => {
  const parsed = toArray(value)
  const normalized: RecentMailItem[] = []

  parsed.forEach((item) => {
    if (typeof item !== 'object' || item === null) return

    const mail = item as Record<string, unknown>

    normalized.push({
      invoice_no: String(mail.invoice_no ?? mail.invoice ?? '-'),
      to_id: Number(mail.to_id ?? mail.customer_id ?? 0),
      email_type: String(mail.email_type ?? mail.type ?? '-'),
      amount: Number(mail.amount ?? 0),
      due_date: String(mail.due_date ?? ''),
      is_complete: Boolean(mail.is_complete ?? mail.completed ?? false),
      created_at: String(mail.created_at ?? ''),
    })
  })

  return normalized
}

const normalizeEmailTypeCount = (value: unknown): EmailTypeCountItem[] => {
  const parsed = toArray(value)
  const normalized: EmailTypeCountItem[] = []

  parsed.forEach((item) => {
    if (typeof item !== 'object' || item === null) return

    const typeCount = item as Record<string, unknown>

    normalized.push({
      email_type: String(typeCount.email_type ?? typeCount.type ?? '-'),
      count: Number(typeCount.count ?? 0),
    })
  })

  return normalized
}

const normalizeDashboard = (payload: unknown): DashboardResponse => {
  if (typeof payload !== 'object' || payload === null) {
    return EMPTY_DASHBOARD
  }

  const data = payload as Record<string, unknown>

  return {
    email_sent: Number(data.email_sent ?? data.total_emails ?? 0),
    total_invoice: Number(data.total_invoice ?? data.total_amount ?? 0),
    active_customers: Number(data.active_customers ?? data.total_customers ?? 0),
    overdue: Number(data.overdue ?? data.pending_overdue ?? 0),
    recent_mail: normalizeRecentMail(data.recent_mail ?? data.recent_emails ?? []),
    email_type_count: normalizeEmailTypeCount(data.email_type_count ?? data.email_counts ?? []),
  }
}

const AdminDashboard = () => {
  const [batches, setBatches] = useState<BatchOption[]>([])
  const [selectedBatchId, setSelectedBatchId] = useState('')
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null)
  const [loadingBatches, setLoadingBatches] = useState(false)
  const [loadingDashboard, setLoadingDashboard] = useState(false)

  const loadDashboard = async (batchId?: string) => {
    try {
      setLoadingDashboard(true)
      const response = await getDashboardApi(batchId || undefined)
      const payload = response?.data?.data ?? response?.data?.dashboard ?? response?.data
      setDashboard(normalizeDashboard(payload))
    } catch (error: any) {
      console.error(error)
      toast.error(error?.response?.data?.detail || 'Failed to load dashboard')
      setDashboard(EMPTY_DASHBOARD)
    } finally {
      setLoadingDashboard(false)
    }
  }

  useEffect(() => {
    const loadBatches = async () => {
      try {
        setLoadingBatches(true)
        const response = await getBatchesApi()
        const payload = response?.data?.data ?? response?.data?.batches ?? response?.data
        setBatches(normalizeBatches(payload))
      } catch (error: any) {
        console.error(error)
        toast.error(error?.response?.data?.detail || 'Failed to load batches')
      } finally {
        setLoadingBatches(false)
      }
    }

    void loadBatches()
  }, [])

  // Reload dashboard when batch changes
  useEffect(() => {
    void loadDashboard(selectedBatchId || undefined)
  }, [selectedBatchId])

  const totalTypeCount =
    dashboard?.email_type_count.reduce((sum, item) => sum + item.count, 0) ?? 0

  const statCards = [
    { label: 'Email Sent', value: dashboard?.email_sent ?? 0, valueClass: 'text-gold' },
    { label: 'Total Invoice', value: formatCurrency(dashboard?.total_invoice ?? 0), valueClass: 'text-asuccess' },
    { label: 'Active Customers', value: dashboard?.active_customers ?? 0, valueClass: 'text-ainfo' },
    { label: 'Overdue', value: dashboard?.overdue ?? 0, valueClass: 'text-adanger' }
  ]

  return (
    <div className="text-adark">
      <div className="flex flex-col gap-4 mb-7 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-adark mb-1">Dashboard</h1>
          <p className="text-sm text-amuted">
            Payment email overview.
          </p>
        </div>

        <div className="w-full max-w-[260px]">
          <label className="block text-xs text-adark uppercase tracking-[0.06em] mb-1.5">
            Filter By Batch
          </label>
          <select
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            className="w-full bg-abg3 border border-white/[0.12] rounded-[10px] px-3.5 py-2.5 text-xs text-adark outline-none transition-colors focus:border-gold cursor-pointer"
          >
            <option value="">
              {loadingBatches ? 'Loading batches...' : 'All batches'}
            </option>
            {batches.map((batch) => (
              <option key={batch.id} value={batch.id}>
                {batch.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
        {statCards.map((card) => (
          <div key={card.label} className="bg-abg2 border border-white/[0.07] rounded-2xl p-4 lg:p-5">
            <p className="text-[11px] text-amuted uppercase tracking-[0.07em] mb-2">{card.label}</p>
            <p className={`text-3xl font-bold ${card.valueClass}`}>
              {loadingDashboard ? '...' : card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-7">
        <div className="xl:col-span-2 bg-abg2 border border-white/[0.07] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.07]">
            <h2 className="text-lg font-bold text-adark">Recent Emails</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="border-b border-white/[0.07]">
                  {['Invoice No', 'User Id', 'Type', 'Amount', 'Due Date', 'Status'].map((heading) => (
                    <th key={heading} className="text-left text-xs px-4 py-3 text-[11px] font-mono uppercase tracking-[0.06em] text-amuted font-medium">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {!loadingDashboard && (dashboard?.recent_mail.length ?? 0) === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-sm text-amuted text-center">
                      No emails found.
                    </td>
                  </tr>
                )}

                {loadingDashboard && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-sm text-amuted text-center">
                      Loading dashboard data... 
                    </td>
                  </tr>
                )}

                {dashboard?.recent_mail.map((mail) => (
                  <tr key={mail.invoice_no} className="border-b border-white/[0.04] hover:bg-abg3 transition-colors">
                    <td className="px-4 py-3 align-middle">
                      <p className="font-semibold text-sm text-adark leading-none">{mail.invoice_no}</p>
                      <p className="text-xs text-amuted mt-1">{formatDate(mail.created_at)}</p>
                    </td>
                    <td className="px-4 py-3 align-middle text-sm text-amuted">
                      #{mail.to_id}
                    </td>
                    <td className="px-4 py-3 align-middle text-sm text-amuted">
                      {formatLabel(mail.email_type)}
                    </td>
                    <td className="px-4 py-3 align-middle text-sm text-adark">
                      {formatCurrency(mail.amount)}
                    </td>
                    <td className="px-4 py-3 align-middle text-sm text-amuted">
                      {formatDate(mail.due_date)}
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <span className={`text-sm font-bold px-2.5 py-0.5 rounded-full ${mail.is_complete ? 'bg-asuccess/10 text-asuccess border border-asuccess/25' : 'bg-gold/10 text-gold border border-gold/25'}`}>
                        {mail.is_complete ? 'Complete' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-abg2 border border-white/[0.07] rounded-2xl p-5">
          <h2 className="text-lg font-bold text-adark mb-5">Email Overview</h2>
          <div className="space-y-5">
            {!loadingDashboard && (dashboard?.email_type_count.length ?? 0) === 0 && (
              <p className="text-sm text-amuted">No email type data found.</p>
            )}

            {loadingDashboard && (
              <p className="text-sm text-amuted">Loading overview...</p>
            )}

            {dashboard?.email_type_count.map((item) => {
              const pct = totalTypeCount > 0 ? Math.round((item.count / totalTypeCount) * 100) : 0
              const colorClass = EMAIL_TYPE_COLOR[getEmailTypeLabel(item.email_type)] ?? 'bg-white/30'

              return (
                <div key={`${item.email_type}-${item.count}`}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-semibold text-adark">{formatLabel(item.email_type)}</span>
                    <span className="text-[11px] text-amuted">{item.count}</span>
                  </div>
                  <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${colorClass}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
