import { useEffect, useMemo, useState } from 'react'
import { Button } from 'antd'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import AdminPortalShell from '../../components/layout/AdminPortalShell'
import { getBatchesApi, getUserByBatchApi } from '../../services/authApi'
import { deleteUser, getAllUsers } from '../../services/adminApi'

interface BatchOption {
  id: number
  label: string
}

interface BatchUser {
  id: number
  name: string
  username: string
  email: string
  phone: string
  status: string
  batch: string
  techStack: string
  createdAt: string
  updatedAt: string
  createdBy: string
  roleType: string
  is2FA: boolean
}

const PAGE_SIZE = 10

const STATUS_CLASSES: Record<string, string> = {
  Active: 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/20',
  Pending: 'bg-amber-500/15 text-amber-300 border border-amber-400/20',
  Selected: 'bg-sky-500/15 text-sky-300 border border-sky-400/20',
  Inactive: 'bg-rose-500/15 text-rose-300 border border-rose-400/20',
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
      const rawLabel = batch.name ?? batch.batch_name ?? batch.label ?? batch.title ?? `Batch ${rawId}`

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

const normalizeStatus = (rawStatus: unknown) => {
  const value = String(rawStatus ?? 'Active').trim()
  if (!value) return 'Active'
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
}

const normalizeRoleType = (rawType: unknown) => {
  const typeValue = Number(rawType)

  if (typeValue === 1) return 'Admin'
  if (typeValue === 2) return 'Intern'
  if (typeValue === 3) return 'User'

  return typeof rawType === 'string' && rawType ? rawType : 'Unknown'
}

const normalizeUsers = (payload: unknown, batchLabel?: string): BatchUser[] => {
  return toArray(payload)
    .map((item) => {
      if (typeof item !== 'object' || item === null) return null

      const user = item as Record<string, unknown>
      const rawId = Number(user.id ?? user.user_id)
      const username = String(user.username ?? user.name ?? '').trim()
      const displayName = String(
        user.name ?? user.full_name ?? user.fullName ?? user.username ?? `User ${rawId}`,
      ).trim()

      if (!Number.isFinite(rawId) || !displayName) return null

      return {
        id: rawId,
        name: displayName,
        username: username || displayName,
        email: String(user.email ?? '-'),
        phone: String(user.phone ?? user.phno ?? user.mobile ?? user.contact_no ?? user.contact ?? '-'),
        status: normalizeStatus(user.status ?? user.user_status),
        batch: String(user.batch ?? user.batch_name ?? batchLabel ?? '-'),
        techStack: String(user.tech_stack ?? user.domain ?? user.role ?? 'Not assigned'),
        createdAt: String(user.created_at ?? '-'),
        updatedAt: String(user.updated_at ?? '-'),
        createdBy: String(user.created_by ?? '-'),
        roleType: normalizeRoleType(user.type ?? user.user_type),
        is2FA: Boolean(user.is2FA ?? user.is_2fa ?? user.two_factor_enabled ?? false),
      }
    })
    .filter((user): user is BatchUser => Boolean(user))
}

const formatDateTime = (value: string) => {
  if (!value || value === '-') return '-'

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

const DeleteIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0">
    <path d="M4 7h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M10 11v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M14 11v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M6 7l1 11a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const AdminUserDashboard = () => {
  const navigate = useNavigate()
  const [batches, setBatches] = useState<BatchOption[]>([])
  const [selectedBatchId, setSelectedBatchId] = useState('all')
  const [loadingBatches, setLoadingBatches] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null)
  const [users, setUsers] = useState<BatchUser[]>([])
  const [selectedUser, setSelectedUser] = useState<BatchUser | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)

  useEffect(() => {
    const loadBatches = async () => {
      try {
        setLoadingBatches(true)
        const response = await getBatchesApi()
        const payload = response?.data?.data ?? response?.data?.batches ?? response?.data
        setBatches(normalizeBatches(payload))
      } catch (error) {
        console.error(error)
        toast.error('Failed to load batches')
      } finally {
        setLoadingBatches(false)
      }
    }

    void loadBatches()
  }, [])

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoadingUsers(true)
        setSelectedUser(null)

        if (selectedBatchId === 'all') {
          const response = await getAllUsers({ page_no: page, page_size: PAGE_SIZE })
          const payload = response?.data ?? {}
          const list = payload.data ?? payload.users ?? payload.items ?? []
          const normalized = normalizeUsers(list, 'All Batches')
          setUsers(normalized)
          setTotalPages(Number(payload.total_pages ?? 1))
          setTotalUsers(Number(payload.total_count ?? payload.total ?? normalized.length))
          return
        }

        const response = await getUserByBatchApi(selectedBatchId)
        const payload = response?.data?.data ?? response?.data?.users ?? response?.data
        const batchLabel =
          batches.find((batch) => String(batch.id) === selectedBatchId)?.label ?? `Batch ${selectedBatchId}`
        const normalized = normalizeUsers(payload, batchLabel)
        setUsers(normalized)
        setTotalPages(1)
        setTotalUsers(normalized.length)
      } catch (error) {
        console.error(error)
        toast.error('Failed to load users')
      } finally {
        setLoadingUsers(false)
      }
    }

    void loadUsers()
  }, [batches, page, selectedBatchId])

  const selectedBatchLabel =
    selectedBatchId === 'all'
      ? 'All Batches'
      : batches.find((batch) => String(batch.id) === selectedBatchId)?.label ?? `Batch ${selectedBatchId}`

  const stats = useMemo(() => {
    const active = users.filter((user) => user.status === 'Active').length
    const pending = users.filter((user) => user.status === 'Pending').length
    const secure = users.filter((user) => user.is2FA).length
    const activePercent = totalUsers ? Math.round((active / totalUsers) * 100) : 0

    return [
      { label: 'Visible Users', value: String(users.length), hint: selectedBatchId === 'all' ? `${selectedBatchLabel} - page ${page}` : selectedBatchLabel, valueClass: 'text-white' },
      { label: 'Total Users', value: String(totalUsers), hint: 'Current filter count', valueClass: 'text-sky-300' },
      { label: 'Pending Users', value: String(pending), hint: 'Need follow-up', valueClass: 'text-amber-300' },
      { label: '2FA Enabled', value: String(secure), hint: `${activePercent}% active coverage`, valueClass: 'text-emerald-300' },
    ]
  }, [page, selectedBatchId, selectedBatchLabel, totalUsers, users])

  const handleDeleteUser = async (user: BatchUser) => {
    if (deletingUserId !== null) return

    const shouldDelete = window.confirm(`Delete user ${user.name} (#${user.id})?`)
    if (!shouldDelete) return

    try {
      setDeletingUserId(user.id)
      await deleteUser(user.id)
      toast.success('User deleted successfully')

      if (selectedBatchId === 'all') {
        const isLastItemOnPage = users.length === 1 && page > 1
        if (isLastItemOnPage) {
          setPage((currentPage) => currentPage - 1)
        } else {
          setUsers((currentUsers) => currentUsers.filter((item) => item.id !== user.id))
          setTotalUsers((currentTotal) => Math.max(0, currentTotal - 1))
        }
      } else {
        setUsers((currentUsers) => currentUsers.filter((item) => item.id !== user.id))
        setTotalUsers((currentTotal) => Math.max(0, currentTotal - 1))
      }

      if (selectedUser?.id === user.id) {
        setSelectedUser(null)
      }
    } catch (error) {
      console.error(error)
      toast.error('Failed to delete user')
    } finally {
      setDeletingUserId(null)
    }
  }

  return (
    <AdminPortalShell title="User Dashboard" subtitle="AdminUserDashboard shows user info only. Payment details stay in PayDesk Users.">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="w-full max-w-[280px]">
            <label className="mb-1.5 block text-xs uppercase tracking-[0.06em] text-adark">
              Filter By Batch
            </label>
            <select
              value={selectedBatchId}
              onChange={(event) => {
                setSelectedBatchId(event.target.value)
                setPage(1)
              }}
              className="w-full cursor-pointer rounded-[10px] border border-white/[0.12] bg-abg3 px-3.5 py-2.5 text-sm text-white outline-none transition-colors focus:border-sky-400"
            >
              <option value="all" className="bg-abg3 text-white">All</option>
              {loadingBatches ? (
                <option value="" disabled className="bg-abg3 text-white">Loading batches...</option>
              ) : (
                batches.map((batch) => (
                  <option key={batch.id} value={batch.id} className="bg-abg3 text-white">
                    {batch.label}
                  </option>
                ))
              )}
            </select>
          </div>

          <Button onClick={() => navigate('/add-user')} className="self-start lg:self-auto" type="primary">
            Add User
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((card) => (
            <div key={card.label} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-slate-400">{card.label}</p>
              <p className={`text-3xl font-extrabold ${card.valueClass}`}>{card.value}</p>
              <p className="mt-2 text-xs text-slate-400">{card.hint}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold">User Information</h2>
              <p className="mt-1 text-xs text-slate-400">{selectedBatchLabel}</p>
            </div>
            <div className="text-xs text-slate-400">
              {selectedBatchId === 'all' ? `Page ${page} of ${totalPages}` : `${totalUsers} users`}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  {['Id', 'Name', 'Email', 'Phone', 'Tech Stack', 'Status', 'View', 'Delete'].map((heading) => (
                    <th key={heading} className="text-left px-5 py-3 text-[11px] uppercase tracking-[0.14em] text-slate-400 font-medium">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loadingUsers ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-8 text-center text-sm text-slate-400">Loading users...</td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-8 text-center text-sm text-slate-400">No users found.</td>
                  </tr>
                ) : (
                  users.map((user) => {
                    const statusClass = STATUS_CLASSES[user.status] ?? 'bg-white/10 text-slate-200 border border-white/10'
                    const isDeleting = deletingUserId === user.id

                    return (
                      <tr key={user.id} className="border-b border-white/5 last:border-b-0">
                        <td className="px-5 py-4 font-mono text-slate-300">#{user.id}</td>
                        <td className="px-5 py-4">
                          <div>
                            <p className="font-semibold text-white">{user.name}</p>
                            <p className="text-xs text-slate-400">@{user.username}</p>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-300">{user.email}</td>
                        <td className="px-5 py-4 text-slate-300">{user.phone}</td>
                        <td className="px-5 py-4 text-slate-300">{user.techStack}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${statusClass}`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <button
                            type="button"
                            onClick={() => setSelectedUser(user)}
                            className="inline-flex items-center gap-2 rounded-lg border border-sky-400/25 bg-sky-500/10 px-3 py-1.5 text-xs font-bold text-sky-300 transition-colors hover:bg-sky-500/20"
                          >
                            <EyeIcon />
                            View
                          </button>
                        </td>
                        <td className="px-5 py-4">
                          <button
                            type="button"
                            disabled={isDeleting}
                            onClick={() => void handleDeleteUser(user)}
                            className="inline-flex items-center gap-2 rounded-lg border border-red-400/25 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-300 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isDeleting ? <div className="loader-btn loader-btn-sm" /> : <DeleteIcon />}
                            {isDeleting ? 'Deleting...' : 'Delete'}
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {selectedBatchId === 'all' && (
            <div className="px-5 py-3 border-t border-white/10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-400">Showing page {page} of {totalPages} for {totalUsers} users.</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  className="rounded-lg border border-white/10 px-3 py-1.5 text-sm font-semibold text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Prev
                </button>
                <button
                  type="button"
                  disabled={page === totalPages}
                  onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                  className="rounded-lg border border-white/10 px-3 py-1.5 text-sm font-semibold text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm" onClick={(event) => {
          if (event.target === event.currentTarget) setSelectedUser(null)
        }}>
          <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-[#111827] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">User Details</p>
                <h3 className="mt-2 text-2xl font-extrabold text-white">{selectedUser.name}</h3>
                <p className="mt-1 text-sm text-slate-400">{selectedUser.email} · {selectedUser.batch}</p>
              </div>
              <button type="button" onClick={() => setSelectedUser(null)} className="rounded-lg border border-white/10 px-3 py-1.5 text-sm font-semibold text-slate-300 transition-colors hover:text-white">
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {[
                { label: 'User ID', value: `#${selectedUser.id}` },
                { label: 'Username', value: selectedUser.username },
                { label: 'Role Type', value: selectedUser.roleType },
                { label: 'Status', value: selectedUser.status },
                { label: 'Phone', value: selectedUser.phone },
                { label: 'Tech Stack', value: selectedUser.techStack },
                { label: 'Batch', value: selectedUser.batch },
                { label: '2FA Enabled', value: selectedUser.is2FA ? 'Yes' : 'No' },
                { label: 'Created By', value: selectedUser.createdBy },
                { label: 'Created At', value: formatDateTime(selectedUser.createdAt) },
                { label: 'Updated At', value: formatDateTime(selectedUser.updatedAt) },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">{item.label}</p>
                  <p className="mt-2 text-sm font-semibold text-white break-words">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </AdminPortalShell>
  )
}

export default AdminUserDashboard
