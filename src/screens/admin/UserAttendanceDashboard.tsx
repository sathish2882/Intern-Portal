import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import AdminPortalShell from '../../components/layout/AdminPortalShell'
import { getBatchesApi, getUserByBatchApi } from '../../services/authApi'
import { viewAttendanceByAdminApi } from '../../services/adminApi'

interface BatchOption {
  id: number
  label: string
}

interface BatchUser {
  id: number
  name: string
  email: string
  phone: string
  status: string
}

interface AttendanceDetail {
  login: string
  logout: string | null
  ideal_time: number | null
}

const STATUS_CLASSES: Record<string, string> = {
  Active: 'bg-asuccess/10 text-asuccess border border-asuccess/25',
  Inactive: 'bg-adanger/10 text-adanger border border-adanger/25',
  Pending: 'bg-gold/10 text-gold border border-gold/25',
}

const DETAILS_PER_PAGE = 10
const DEFAULT_BATCH_ID = '4'

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

const normalizeUsers = (payload: unknown): BatchUser[] => {
  return toArray(payload)
    .map((item) => {
      if (typeof item !== 'object' || item === null) return null

      const user = item as Record<string, unknown>
      const rawId = Number(user.id ?? user.user_id)
      const name = user.name ?? user.username ?? user.full_name ?? user.fullName
      const email = user.email
      const phone = user.phone ?? user.mobile ?? user.contact_no ?? user.contact ?? '-'
      const status = user.status ?? user.user_status ?? 'Active'

      if (!Number.isFinite(rawId) || !name || !email) return null

      return {
        id: rawId,
        name: String(name),
        email: String(email),
        phone: String(phone),
        status: String(status),
      }
    })
    .filter((user): user is BatchUser => Boolean(user))
}

const formatDateTime = (value: string | null) => {
  if (!value) return '-'

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value

  return parsed.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatHours = (value: number | null) => {
  if (value == null) return '-'
  return `${value} hrs`
}

const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0">
    <path
      d="M1.5 12s3.82-6.5 10.5-6.5S22.5 12 22.5 12s-3.82 6.5-10.5 6.5S1.5 12 1.5 12Z"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="3.25" stroke="currentColor" strokeWidth="1.7" />
  </svg>
)

const UserAttendanceDashboard = () => {
  const [batches, setBatches] = useState<BatchOption[]>([])
  const [selectedBatchId, setSelectedBatchId] = useState('')
  const [users, setUsers] = useState<BatchUser[]>([])
  const [loadingBatches, setLoadingBatches] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [selectedUserName, setSelectedUserName] = useState('')
  const [attendanceDetails, setAttendanceDetails] = useState<AttendanceDetail[]>([])
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [detailsPage, setDetailsPage] = useState(1)

  useEffect(() => {
    const loadBatches = async () => {
      try {
        setLoadingBatches(true)
        const response = await getBatchesApi()
        const payload = response?.data?.data ?? response?.data?.batches ?? response?.data
        const normalizedBatches = normalizeBatches(payload)
        setBatches(normalizedBatches)

        const hasDefaultBatch = normalizedBatches.some((batch) => String(batch.id) === DEFAULT_BATCH_ID)
        if (hasDefaultBatch) {
          await handleBatchChange(DEFAULT_BATCH_ID)
        }
      } catch (error) {
        console.error(error)
        toast.error('Failed to load batches')
      } finally {
        setLoadingBatches(false)
      }
    }

    void loadBatches()
  }, [])

  const handleBatchChange = async (batchId: string) => {
    setSelectedBatchId(batchId)
    setUsers([])
    closeDetails()

    if (!batchId) return

    try {
      setLoadingUsers(true)
      const response = await getUserByBatchApi(batchId)
      const payload = response?.data?.data ?? response?.data?.users ?? response?.data
      setUsers(normalizeUsers(payload))
    } catch (error) {
      console.error(error)
      toast.error('Failed to load users for batch')
    } finally {
      setLoadingUsers(false)
    }
  }

  const totalUsers = users.length
  const activeUsers = users.filter((user) => user.status === 'Active').length
  const pendingUsers = users.filter((user) => user.status === 'Pending').length
  const inactiveUsers = users.filter((user) => user.status === 'Inactive').length

  const attendanceStats = [
    { label: 'Total Users', value: totalUsers, hint: 'Available in table', valueClass: 'text-ainfo' },
    { label: 'Active Users', value: activeUsers, hint: 'Current active records', valueClass: 'text-asuccess' },
    { label: 'Pending Users', value: pendingUsers, hint: 'Need follow-up', valueClass: 'text-gold' },
    { label: 'Inactive Users', value: inactiveUsers, hint: 'Not currently active', valueClass: 'text-adanger' },
  ]

  const paginatedDetails = useMemo(() => {
    const startIndex = (detailsPage - 1) * DETAILS_PER_PAGE
    return attendanceDetails.slice(startIndex, startIndex + DETAILS_PER_PAGE)
  }, [attendanceDetails, detailsPage])

  const totalPages = Math.max(1, Math.ceil(attendanceDetails.length / DETAILS_PER_PAGE))

  const handleViewAttendance = async (userId: number, userName: string) => {
    try {
      setLoadingDetails(true)
      setSelectedUserId(userId)
      setSelectedUserName(userName)
      setDetailsPage(1)

      const response = await viewAttendanceByAdminApi(userId)
      setAttendanceDetails(Array.isArray(response.data) ? response.data : [])
    } catch (error) {
      console.error(error)
      toast.error('Failed to load attendance details')
      setSelectedUserId(null)
      setSelectedUserName('')
      setAttendanceDetails([])
    } finally {
      setLoadingDetails(false)
    }
  }

  const closeDetails = () => {
    setSelectedUserId(null)
    setSelectedUserName('')
    setAttendanceDetails([])
    setDetailsPage(1)
  }

  return (
    <AdminPortalShell title="User Attendance Dashboard">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-end">
        <div className="w-full max-w-[260px]">
          <label className="mb-1.5 block text-xs uppercase tracking-[0.06em] text-adark">
            Filter By Batch
          </label>
          <select
            value={selectedBatchId}
            onChange={(event) => void handleBatchChange(event.target.value)}
            className="w-full cursor-pointer rounded-[10px] border border-white/[0.12] bg-abg3 px-3.5 py-2.5 text-xs text-adark outline-none transition-colors focus:border-gold"
          >
            <option value="">
              {loadingBatches ? 'Loading batches...' : 'Choose batch...'}
            </option>
            {batches.map((batch) => (
              <option key={batch.id} value={batch.id}>
                {batch.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {attendanceStats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400 mb-2">{stat.label}</p>
            <p className={`text-3xl font-extrabold ${stat.valueClass}`}>{stat.value}</p>
            <p className="text-xs text-slate-400 mt-2">{stat.hint}</p>
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
                {['Id', 'Name', 'Email', 'Phone', 'Status', 'Action'].map((heading) => (
                  <th key={heading} className="text-left px-5 py-3 text-[11px] uppercase tracking-[0.14em] text-slate-400 font-medium">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!selectedBatchId && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-slate-400">
                    Select a batch to view users.
                  </td>
                </tr>
              )}
              {selectedBatchId && loadingUsers && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-slate-400">
                    Loading users...
                  </td>
                </tr>
              )}
              {selectedBatchId && !loadingUsers && users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-slate-400">
                    No users found for this batch.
                  </td>
                </tr>
              )}
              {!loadingUsers && users.map((customer) => (
                  <tr key={customer.id} className="border-b border-white/5 last:border-b-0">
                    <td className="px-5 py-4 font-mono text-slate-300">#{customer.id}</td>
                    <td className="px-5 py-4 font-semibold">{customer.name}</td>
                    <td className="px-5 py-4 text-slate-300">{customer.email}</td>
                    <td className="px-5 py-4 text-slate-300">{customer.phone}</td>
                    <td className="px-5 py-4">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${STATUS_CLASSES[customer.status]}`}>
                        {customer.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => void handleViewAttendance(customer.id, customer.name)}
                        className="inline-flex items-center gap-2 rounded-lg border border-ainfo/25 bg-ainfo/10 px-3 py-1.5 text-xs font-bold text-ainfo transition-colors hover:bg-ainfo/20"
                      >
                        <EyeIcon />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedUserId !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeDetails()
          }}
        >
          <div className="w-full max-w-5xl rounded-2xl border border-white/10 bg-abg2 p-6 max-h-[90vh] overflow-y-auto">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-adark">Attendance Details</h3>
                <p className="text-sm text-amuted mt-1">
                  {selectedUserName} (User ID: {selectedUserId})
                </p>
              </div>
              <button
                type="button"
                onClick={closeDetails}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-sm font-semibold text-amuted transition-colors hover:text-adark"
              >
                Close
              </button>
            </div>

            <div className="rounded-2xl border border-white/10 bg-abg3 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      {['Login', 'Logout', 'Idle Time'].map((heading) => (
                        <th key={heading} className="text-left px-5 py-3 text-[11px] uppercase tracking-[0.14em] text-slate-400 font-medium">
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loadingDetails && (
                      <tr>
                        <td colSpan={3} className="px-5 py-8 text-center text-sm text-slate-400">
                          Loading attendance details...
                        </td>
                      </tr>
                    )}

                    {!loadingDetails && attendanceDetails.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-5 py-8 text-center text-sm text-slate-400">
                          No attendance details found.
                        </td>
                      </tr>
                    )}

                    {!loadingDetails && paginatedDetails.map((detail, index) => (
                      <tr key={`${detail.login}-${index}`} className="border-b border-white/5 last:border-b-0">
                        <td className="px-5 py-4 text-slate-200">{formatDateTime(detail.login)}</td>
                        <td className="px-5 py-4 text-slate-300">{formatDateTime(detail.logout)}</td>
                        <td className="px-5 py-4 font-mono text-slate-200">{formatHours(detail.ideal_time)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {!loadingDetails && attendanceDetails.length > DETAILS_PER_PAGE && (
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-amuted">
                  Showing {(detailsPage - 1) * DETAILS_PER_PAGE + 1}-
                  {Math.min(detailsPage * DETAILS_PER_PAGE, attendanceDetails.length)} of {attendanceDetails.length}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={detailsPage === 1}
                    onClick={() => setDetailsPage((page) => Math.max(1, page - 1))}
                    className="rounded-lg border border-white/10 px-3 py-1.5 text-sm font-semibold text-adark disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-amuted">
                    Page {detailsPage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={detailsPage === totalPages}
                    onClick={() => setDetailsPage((page) => Math.min(totalPages, page + 1))}
                    className="rounded-lg border border-white/10 px-3 py-1.5 text-sm font-semibold text-adark disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminPortalShell>
  )
}

export default UserAttendanceDashboard
