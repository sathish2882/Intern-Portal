import { useState, useEffect, useMemo } from 'react'
import { toast } from 'react-toastify'
import { getBatchesApi } from '../../services/authApi'
import { getAllUsers, getBatchUsers } from '../../services/adminApi'

interface BatchOption {
  id: number
  label: string
}

interface PaymentUser {
  id: number
  username: string
  email: string
  phone: string
  batch: string
  totalFee: number
  paidAmount: number
  dueAmount: number
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
      return { id: rawId, label: String(rawLabel) }
    }

    const rawId = Number(item)
    return {
      id: Number.isFinite(rawId) ? rawId : index + 1,
      label: `Batch ${String(item)}`,
    }
  })
}

const normalizePaymentUsers = (payload: unknown, batchLabel?: string): PaymentUser[] => {
  return toArray(payload)
    .map((item) => {
      if (typeof item !== 'object' || item === null) return null

      const user = item as Record<string, unknown>
      const rawId = Number(user.id ?? user.user_id)
      const username = String(user.username ?? user.name ?? '').trim()

      if (!Number.isFinite(rawId) || !username) return null

      return {
        id: rawId,
        username,
        email: String(user.email ?? '-'),
        phone: String(user.phone ?? user.phno ?? user.mobile ?? '-'),
        batch: String(user.batch ?? user.batch_name ?? batchLabel ?? 'N/A'),
        totalFee: Number(user.total_fee ?? user.fees ?? 0),
        paidAmount: Number(user.paid_amount ?? 0),
        dueAmount: Number(user.due_amount ?? 0),
      }
    })
    .filter((user): user is PaymentUser => Boolean(user))
}

const formatCurrency = (value: number) => `Rs.${value.toLocaleString('en-IN')}`

const User = () => {
  const [customers, setCustomers] = useState<PaymentUser[]>([])
  const [search, setSearch] = useState('')
  const [batch, setBatch] = useState('all')
  const [batches, setBatches] = useState<BatchOption[]>([])
  const [loading, setLoading] = useState(false)

  const loadBatches = async () => {
    try {
      const response = await getBatchesApi()
      const payload = response?.data?.data ?? response?.data?.batches ?? response?.data
      setBatches(normalizeBatches(payload))
    } catch (error) {
      console.error(error)
      toast.error('Failed to load batches')
    }
  }

  const fetchAll = async () => {
    try {
      setLoading(true)
      const res = await getAllUsers({ page_no: 1, page_size: 100 })
      const payload = res?.data?.data ?? res?.data?.users ?? res?.data
      setCustomers(normalizePaymentUsers(payload, 'All'))
    } catch (err) {
      console.error(err)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const fetchBatch = async (id: number) => {
    try {
      setLoading(true)
      const res = await getBatchUsers(id)
      const payload = res?.data?.data ?? res?.data?.users ?? res?.data
      const batchLabel = batches.find((item) => item.id === id)?.label ?? `Batch ${id}`
      setCustomers(normalizePaymentUsers(payload, batchLabel))
    } catch (err) {
      console.error(err)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadBatches()
    void fetchAll()
  }, [])

  const filtered = useMemo(
    () =>
      customers.filter(
        (c) =>
          c.username?.toLowerCase().includes(search.toLowerCase()) ||
          c.email?.toLowerCase().includes(search.toLowerCase()),
      ),
    [customers, search],
  )

  return (
    <div className="text-adark">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-7">
        <div>
          <h1 className="text-2xl font-extrabold text-adark mb-1">Users</h1>
          <p className="text-sm text-amuted">PayDesk Users shows only payment-related information.</p>
        </div>
      </div>

      <div className="flex gap-3 mb-4 justify-between">
        <div className="relative max-w-sm w-full">
          <input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-abg2 border border-white/[0.07] rounded-[10px] pl-4 pr-4 py-2.5 text-sm text-adark outline-none"
          />
        </div>

        <select
          value={batch}
          onChange={(e) => {
            const val = e.target.value
            setBatch(val)

            if (val === 'all') void fetchAll()
            else void fetchBatch(Number(val))
          }}
          className="bg-abg2 border border-white/[0.07] rounded-[10px] px-3 py-2.5 text-sm text-adark"
        >
          <option value="all">All</option>
          {batches.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-abg2 border border-white/[0.07] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.07]">
                {['Name', 'Phone', 'Batch', 'Total Fee', 'Paid', 'Due'].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-[11px] text-amuted">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-amuted">Loading users...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-amuted">No users found.</td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="border-b border-white/[0.04]">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold">{c.username}</p>
                      <p className="text-xs text-amuted">{c.email}</p>
                    </td>
                    <td className="px-5 py-3.5 text-amuted">{c.phone}</td>
                    <td className="px-5 py-3.5">{c.batch}</td>
                    <td className="px-5 py-3.5 text-ainfo font-semibold">{formatCurrency(c.totalFee)}</td>
                    <td className="px-5 py-3.5 text-asuccess font-semibold">{formatCurrency(c.paidAmount)}</td>
                    <td className="px-5 py-3.5 text-adanger font-semibold">{formatCurrency(c.dueAmount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default User
