import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { EmailType } from '../../types'
import {
  getBatchesApi,
  getUserByBatchApi,
  paymentEmailApi,
} from '../../services/authApi'

const EMAIL_TYPES: { key: EmailType; label: string }[] = [
  { key: 'invoice', label: 'Invoice' },
  { key: 'reminder', label: 'Reminder' },
  { key: 'confirmation', label: 'Confirmation' },
  { key: 'renewal', label: 'Renewal' },
]

const TYPE_COLOR: Record<EmailType, string> = {
  invoice: 'text-gold border-gold bg-gold/10',
  reminder: 'text-ainfo border-ainfo bg-ainfo/10',
  confirmation: 'text-asuccess border-asuccess bg-asuccess/10',
  renewal: 'text-adanger border-adanger bg-adanger/10',
}

const TYPE_ACTIVE: Record<EmailType, string> = {
  invoice: 'bg-gold text-abg border-gold',
  reminder: 'bg-ainfo text-white border-ainfo',
  confirmation: 'bg-asuccess text-abg border-asuccess',
  renewal: 'bg-adanger text-white border-adanger',
}

const EMAIL_TYPE_ID: Record<EmailType, number> = {
  invoice: 0,
  reminder: 1,
  confirmation: 2,
  renewal: 3,
}

interface AdminInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
}

interface BatchOption {
  id: number
  label: string
}

interface BatchUser {
  id: number
  name: string
  email: string
}

const AdminInput = ({ label, ...props }: AdminInputProps) => (
  <div>
    <label className="block text-xs text-adark uppercase tracking-[0.06em] mb-1.5">{label}</label>
    <input
      {...props}
      className="w-full bg-abg3 border border-white/[0.12] rounded-[10px] px-3.5 py-2.5 text-xs text-amuted outline-none transition-colors focus:border-gold placeholder:text-amuted2"
    />
  </div>
)

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
      const name =
        user.name ??
        user.username ??
        user.full_name ??
        user.fullName
      const email = user.email

      if (!Number.isFinite(rawId) || !name || !email) return null

      return {
        id: rawId,
        name: String(name),
        email: String(email),
      }
    })
    .filter((user): user is BatchUser => Boolean(user))
}

const SendEmail = () => {
  const [emailType, setEmailType] = useState<EmailType>('invoice')
  const [batches, setBatches] = useState<BatchOption[]>([])
  const [users, setUsers] = useState<BatchUser[]>([])
  const [selectedBatchId, setSelectedBatchId] = useState('')
  const [selectedUserId, setSelectedUserId] = useState('')
  const [loadingBatches, setLoadingBatches] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [sending, setSending] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    amount: '',
    invoiceNo: '',
    dueDate: '',
    upiId: 'business@upi',
    payLink: '',
    note: '',
  })

  const set = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }))

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

    loadBatches()
  }, [])

  useEffect(() => {
    const loadUsers = async () => {
      if (!selectedBatchId) {
        setUsers([])
        setSelectedUserId('')
        set('name', '')
        set('email', '')
        return
      }

      try {
        setLoadingUsers(true)
        const response = await getUserByBatchApi(selectedBatchId)
        const payload = response?.data?.data ?? response?.data?.users ?? response?.data
        const normalizedUsers = normalizeUsers(payload)
        setUsers(normalizedUsers)
      } catch (error) {
        console.error(error)
        toast.error('Failed to load batch users')
        setUsers([])
      } finally {
        setLoadingUsers(false)
      }
    }

    loadUsers()
  }, [selectedBatchId])

  const handleCustomer = (id: string) => {
    setSelectedUserId(id)
    const customer = users.find((x) => x.id === Number(id))

    if (customer) {
      set('name', customer.name)
      set('email', customer.email)
    }
  }

  const handleSend = async () => {
    if (!selectedUserId || !form.name || !form.email || !form.amount || !form.dueDate) {
      toast.error('Please select user and fill Name, Email, Amount and Due Date')
      return
    }

    try {
      setSending(true)

      const payload = {
        user_id: Number(selectedUserId),
        amount: Number(form.amount),
        due_date: form.dueDate,
        note: form.note || '',
        email_type: EMAIL_TYPE_ID[emailType],
        upi_id: form.upiId,
      }

      await paymentEmailApi(payload)
      toast.success(`Email sent to ${form.email}`)
    } catch (error) {
      console.error(error)
      toast.error('Failed to send payment email')
    } finally {
      setSending(false)
    }
  }

  const previewTitle: Record<EmailType, string> = {
    invoice: `Invoice ${form.invoiceNo || '#INV-0001'}`,
    reminder: 'Payment Reminder',
    confirmation: 'Payment Confirmation',
    renewal: 'Renewal Notice',
  }

  return (
    <div className="text-adark">
      <div className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-adark mb-1">Send Email</h1>
          <p className="text-sm text-amuted">
            Compose and send payment emails to your customers.
          </p>
        </div>

        <div className="w-full max-w-[260px]">
          <label className="block text-xs text-adark uppercase tracking-[0.06em] mb-1.5">
            Batch Filter
          </label>
          <select
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            className="w-full bg-abg3 border border-white/[0.12] rounded-[10px] px-3.5 py-2.5 text-xs text-amuted outline-none focus:border-gold cursor-pointer"
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

      <div className="flex flex-wrap gap-5 mb-6">
        {EMAIL_TYPES.map((t) => (
          <button
            key={t.key}
            onClick={() => setEmailType(t.key)}
            className={`px-4 py-2 rounded-[10px] text-lg font-bold border transition-all
              ${emailType === t.key ? TYPE_ACTIVE[t.key] : `bg-abg3 ${TYPE_COLOR[t.key]}`}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="bg-abg2 border border-white/[0.07] rounded-2xl p-5">
          <h2 className="text-lg font-bold text-adark mb-4">Email Details</h2>

          <div className="mb-4">
            <label className="block text-xs text-adark uppercase tracking-[0.06em] mb-1.5">
              Select Customer
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => handleCustomer(e.target.value)}
              disabled={!selectedBatchId || loadingUsers}
              className="w-full bg-abg3 border border-white/[0.12] rounded-[10px] px-3.5 py-2.5 text-xs text-amuted outline-none focus:border-gold cursor-pointer disabled:opacity-60"
            >
              <option value="">
                {!selectedBatchId
                  ? 'Select batch first...'
                  : loadingUsers
                    ? 'Loading users...'
                    : 'Choose batch user...'}
              </option>
              {users.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} - {c.email}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <AdminInput label="Name" placeholder="Customer name" value={form.name} onChange={(e) => set('name', e.target.value)} />
            <AdminInput label="Email" placeholder="customer@example.com" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
            <AdminInput label="Amount (Rs)" placeholder="0" type="number" value={form.amount} onChange={(e) => set('amount', e.target.value)} />
            <AdminInput label="Invoice No." placeholder="INV-0001" value={form.invoiceNo} onChange={(e) => set('invoiceNo', e.target.value)} />
            <AdminInput label="Due Date" type="date" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} />
            <AdminInput label="UPI ID" value={form.upiId} onChange={(e) => set('upiId', e.target.value)} />
          </div>

          <div className="mb-3">
            <AdminInput
              label="Payment Link (optional)"
              placeholder="https://pay.example.com/..."
              value={form.payLink}
              onChange={(e) => set('payLink', e.target.value)}
            />
          </div>

          <div className="mb-5">
            <label className="block text-xs text-adark uppercase tracking-[0.06em] mb-1.5">
              Custom Note (optional)
            </label>
            <textarea
              rows={3}
              placeholder="Add any extra information..."
              value={form.note}
              onChange={(e) => set('note', e.target.value)}
              className="w-full bg-abg3 border border-white/[0.12] rounded-[10px] px-3.5 py-2.5 text-xs text-amuted outline-none focus:border-gold resize-y placeholder:text-amuted2"
            />
          </div>

          <button
            onClick={handleSend}
            disabled={sending}
            className={`w-full py-3 rounded-[10px] text-md font-bold transition-all hover:opacity-90 text-white/90 border ${TYPE_ACTIVE[emailType]} disabled:opacity-60`}
          >
            <span className="flex h-6 w-[120px] items-center justify-center mx-auto">
              {sending ? <div className="loader-btn scale-75" /> : 'Send Email ->'}
            </span>
          </button>
        </div>

        <div className="bg-abg2 border border-white/[0.07] rounded-2xl p-5">
          <h2 className="text-lg font-bold text-adark mb-4">Preview</h2>
          <div className="bg-abg3 border border-white/[0.07] rounded-xl p-4">
            <div className="flex items-center gap-3 pb-3 mb-3 border-b border-white/[0.07]">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold text-abg ${TYPE_ACTIVE[emailType].split(' ')[0]}`}>
                $
              </div>
              <div>
                <p className="text-sm font-bold text-adark">M-Guru Payments</p>
                <p className="text-sm text-amuted font-mono">payments@mguru.com</p>
              </div>
            </div>
            <p className="text-xs text-amuted mb-1">
              To: <span className="text-adark">{form.email || 'customer@example.com'}</span>
            </p>
            <p className="text-sm font-bold text-adark mb-3">{previewTitle[emailType]}</p>
            <p className="text-xs text-amuted mb-3">
              Dear <span className="text-adark">{form.name || 'Customer'}</span>,
            </p>
            <div className={`rounded-[10px] p-3 mb-3 text-center border ${TYPE_COLOR[emailType]}`}>
              <p className="text-sm text-amuted mb-0.5">Amount Due</p>
              <p className="text-3xl font-bold">Rs {form.amount || '0'}</p>
              {form.dueDate && <p className="text-xs text-amuted mt-1">Due by {form.dueDate}</p>}
            </div>
            {form.note && (
              <p className="text-sm text-amuted bg-white/[0.03] rounded-lg p-2.5">{form.note}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SendEmail
