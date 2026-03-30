import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { Button } from 'antd'
import AdminPortalShell from '../../components/layout/AdminPortalShell'
import { getBatchesApi, getUserByBatchApi } from '../../services/authApi'
import { viewAttendanceByAdminApi, getAllUsers } from '../../services/adminApi'
import { downloadExcel } from '../../utils/download'

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
const PAGE_SIZE = 10

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

const normalizeBatches = (payload: unknown): BatchOption[] =>
  toArray(payload).map((item, index) => {
    if (typeof item === 'object' && item !== null) {
      const b = item as Record<string, unknown>
      return {
        id: Number(b.id ?? b.batch_id ?? index + 1),
        label: String(b.name ?? b.batch_name ?? `Batch ${index + 1}`),
      }
    }
    return { id: index + 1, label: `Batch ${String(item)}` }
  })

const normalizeUsers = (payload: unknown): BatchUser[] =>
  toArray(payload)
    .map((item) => {
      if (typeof item !== 'object' || item === null) return null
      const u = item as Record<string, unknown>

      const id = Number(u.id ?? u.user_id)
      const name = u.name ?? u.username
      const email = u.email

      if (!id || !name || !email) return null

      return {
        id,
        name: String(name),
        email: String(email),
        phone: String(u.phone ?? u.mobile ?? '-'),
        status: String(u.status ?? 'Active'),
      }
    })
    .filter((u): u is BatchUser => Boolean(u))

const formatDateTime = (value: string | null) => {
  if (!value) return '-'
  const d = new Date(value)
  if (isNaN(d.getTime())) return value
  return d.toLocaleString('en-IN', {
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
  const [selectedBatchId, setSelectedBatchId] = useState('all')
  const [users, setUsers] = useState<BatchUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  const [page, setPage] = useState(1)
  const [totalPagesUsers, setTotalPagesUsers] = useState(1)

  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [selectedUserName, setSelectedUserName] = useState('')
  const [attendanceDetails, setAttendanceDetails] = useState<AttendanceDetail[]>([])
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [detailsPage, setDetailsPage] = useState(1)

  // Load batches
  useEffect(() => {
    const load = async () => {
      try {
        const res = await getBatchesApi()
        setBatches(normalizeBatches(res?.data?.data ?? res?.data))
      } catch {
        toast.error('Failed to load batches')
      }
    }
    load()
  }, [])

  // Load users
  useEffect(() => {
    const load = async () => {
      try {
        setLoadingUsers(true)

        if (selectedBatchId === 'all') {
          const res = await getAllUsers({ page_no: page, page_size: PAGE_SIZE })
          const payload = res?.data ?? {}
          const list = payload.data ?? payload.users ?? []

          setUsers(normalizeUsers(list))
          setTotalPagesUsers(payload.total_pages ?? 1)
        } else {
          const res = await getUserByBatchApi(selectedBatchId)
          const payload = res?.data?.data ?? res?.data

          setUsers(normalizeUsers(payload))
          setTotalPagesUsers(1)
        }
      } catch {
        toast.error('Failed to load users')
      } finally {
        setLoadingUsers(false)
      }
    }

    load()
  }, [selectedBatchId, page])

  // Stats
  const totalUsers = users.length
  const activeUsers = users.filter((u) => u.status === 'Active').length
  const pendingUsers = users.filter((u) => u.status === 'Pending').length
  const inactiveUsers = users.filter((u) => u.status === 'Inactive').length

  const attendanceStats = [
    { label: 'Total Users', value: totalUsers, hint: 'Available in table', valueClass: 'text-ainfo' },
    { label: 'Active Users', value: activeUsers, hint: 'Current active records', valueClass: 'text-asuccess' },
    { label: 'Pending Users', value: pendingUsers, hint: 'Need follow-up', valueClass: 'text-gold' },
    { label: 'Inactive Users', value: inactiveUsers, hint: 'Not currently active', valueClass: 'text-adanger' },
  ]

  // SAFE pagination
  const paginatedDetails = useMemo(() => {
    if (!Array.isArray(attendanceDetails)) return []
    const start = (detailsPage - 1) * DETAILS_PER_PAGE
    return attendanceDetails.slice(start, start + DETAILS_PER_PAGE)
  }, [attendanceDetails, detailsPage])

  // View attendance (FIXED)
 const handleViewAttendance = async (id: number, name: string) => {
  try {
    setSelectedUserId(id)
    setSelectedUserName(name)
    setDetailsPage(1)
    setLoadingDetails(true)

    const res = await viewAttendanceByAdminApi(id)

    const payload =
      res?.data?.data ??
      res?.data?.attendance ??
      res?.data

    // ✅ TRANSFORM BACKEND → UI FORMAT
    const normalized = Array.isArray(payload)
      ? payload.map((item: any) => ({
          login: item.first_login ?? null,
          logout: item.last_logout ?? null,
          ideal_time: item.productive_minutes ?? null,
        }))
      : []

    setAttendanceDetails(normalized)
  } catch (error: any) {
    console.error(error)
    toast.error(error?.response?.data?.detail || 'Failed to load attendance details')
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

      {/* FILTER */}
      <div className="mb-6 flex justify-end">
        <select
          value={selectedBatchId}
          onChange={(e) => {
            setSelectedBatchId(e.target.value)
            setPage(1)
          }}
          className="w-[260px] rounded-[10px] border border-white/[0.12] bg-abg3 px-3.5 py-2.5 text-xs"
        >
          <option value="all">All</option>
          {batches.map((b) => (
            <option key={b.id} value={String(b.id)}>
              {b.label}
            </option>
          ))}
        </select>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {attendanceStats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400 mb-2">{stat.label}</p>
            <p className={`text-3xl font-extrabold ${stat.valueClass}`}>{stat.value}</p>
            <p className="text-xs text-slate-400 mt-2">{stat.hint}</p>
          </div>
        ))}
      </div>

      {/* TABLE */}
      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                {['Id','Name','Email','Phone','Status','Action'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loadingUsers ? (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-400">Loading users...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-400">No users found</td></tr>
              ) : (
                users.map(u => (
                  <tr key={u.id} className="border-b border-white/5 last:border-b-0">
                    <td className="px-5 py-4 font-mono text-slate-300">#{u.id}</td>
                    <td className="px-5 py-4 font-semibold">{u.name}</td>
                    <td className="px-5 py-4 text-slate-300">{u.email}</td>
                    <td className="px-5 py-4 text-slate-300">{u.phone}</td>
                    <td className="px-5 py-4">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${STATUS_CLASSES[u.status]}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => handleViewAttendance(u.id, u.name)}
                        className="inline-flex items-center gap-2 rounded-lg border border-ainfo/25 bg-ainfo/10 px-3 py-1.5 text-xs font-bold text-ainfo hover:bg-ainfo/20"
                      >
                        <EyeIcon />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {selectedBatchId === 'all' && (
          <div className="px-5 py-3 border-t border-white/10 flex justify-between">
            <p className="text-xs text-slate-400">Page {page} of {totalPagesUsers}</p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
              <button disabled={page === totalPagesUsers} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>

      {users.length > 0 && (
        <div className="flex justify-end py-5">
          <Button
            onClick={() =>
              downloadExcel(
                users.map((u) => ({
                  ID: u.id,
                  Name: u.name,
                  Email: u.email,
                  Phone: u.phone,
                  Status: u.status,
                })),
                { filename: 'attendance_users.xlsx', sheetName: 'Users' },
              )
            }
            type="primary"
            size="small"
          >
            Download Excel
          </Button>
        </div>
      )}

      {/*  MODAL  */}
      {selectedUserId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) closeDetails() }}>
          
          <div className="w-full max-w-5xl rounded-2xl border border-white/10 bg-abg2 p-6 max-h-[90vh] overflow-y-auto">

            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-adark">Attendance Details</h3>
                <p className="text-sm text-amuted mt-1">
                  {selectedUserName} (User ID: {selectedUserId})
                </p>
              </div>
              <button
                onClick={closeDetails}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-sm font-semibold text-amuted hover:text-adark"
              >
                Close
              </button>
            </div>

            {attendanceDetails.length > 0 && !loadingDetails && (
              <div className="flex justify-end mb-4">
                <Button
                  onClick={() =>
                    downloadExcel(
                      attendanceDetails.map((d) => ({
                        Login: formatDateTime(d.login),
                        Logout: formatDateTime(d.logout),
                        'Idle Time': formatHours(d.ideal_time),
                      })),
                      {
                        filename: `attendance_${selectedUserName.replace(/\s+/g, '_')}.xlsx`,
                        sheetName: 'Attendance',
                      },
                    )
                  }
                  type="primary"
                  size="small"
                >
                  Download Excel
                </Button>
              </div>
            )}

            <div className="rounded-2xl border border-white/10 bg-abg3 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      {['Login','Logout','Idle Time'].map(h => (
                        <th key={h} className="px-5 py-3 text-xs text-slate-400">{h}</th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {loadingDetails && (
                      <tr><td colSpan={3} className="px-5 py-8 text-center text-slate-400">Loading attendance details...</td></tr>
                    )}

                    {!loadingDetails && paginatedDetails.length === 0 && (
                      <tr><td colSpan={3} className="px-5 py-8 text-center text-slate-400">No attendance details found.</td></tr>
                    )}

                    {!loadingDetails && paginatedDetails.map((d, i) => (
                      <tr key={i} className="border-b border-white/5 last:border-b-0">
                        <td className="px-5 py-4 text-center text-slate-200">{formatDateTime(d.login)}</td>
                        <td className="px-5 py-4 text-center text-slate-300">{formatDateTime(d.logout)}</td>
                        <td className="px-5 py-4 text-center text-slate-200">{formatHours(d.ideal_time)}</td>
                      </tr>
                    ))}
                  </tbody>

                </table>
              </div>
            </div>

          </div>
        </div>
      )}

    </AdminPortalShell>
  )
}

export default UserAttendanceDashboard