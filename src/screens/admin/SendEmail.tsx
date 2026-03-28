import { useEffect, useState } from 'react'
import { Form, Formik } from 'formik'
import * as Yup from 'yup'
import { toast } from 'react-toastify'
import FormInput from '../../components/form/FormInput'
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
  invoice: 1,
  reminder: 2,
  confirmation: 3,
  renewal: 4,
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

interface SendEmailFormValues {
  batchId: string
  userId: string
  name: string
  email: string
  amount: number | null
  dueDate: string
  upiId: string
  note: string
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

const normalizeUsers = (payload: unknown): BatchUser[] => {
  return toArray(payload)
    .map((item) => {
      if (typeof item !== 'object' || item === null) return null

      const user = item as Record<string, unknown>
      const rawId = Number(user.id ?? user.user_id)
      const name = user.name ?? user.username ?? user.full_name ?? user.fullName
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

const validationSchema = Yup.object({
  batchId: Yup.string().required('Select batch'),
  userId: Yup.string().required('Select customer'),
  name: Yup.string().required('Enter name'),
  email: Yup.string().email('Invalid email').required('Enter email'),
  amount: Yup.number().typeError('Enter amount').positive('Amount must be greater than 0').required('Enter amount'),
  dueDate: Yup.string().required('Select due date'),
  upiId: Yup.string().required('Enter UPI ID'),
  note: Yup.string(),
})

const SendEmail = () => {
  const [emailType, setEmailType] = useState<EmailType>('invoice')
  const [batches, setBatches] = useState<BatchOption[]>([])
  const [users, setUsers] = useState<BatchUser[]>([])
  const [loadingBatches, setLoadingBatches] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [sending, setSending] = useState(false)

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

  const previewTitle = (): Record<EmailType, string> => ({
    invoice: 'Invoice Notice',
    reminder: 'Payment Reminder',
    confirmation: 'Payment Confirmation',
    renewal: 'Renewal Notice',
  })

  return (
    <Formik<SendEmailFormValues>
      initialValues={{
        batchId: '',
        userId: '',
        name: '',
        email: '',
        amount: null,
        dueDate: '',
        upiId: 'business@upi',
        note: '',
      }}
      validationSchema={validationSchema}
      onSubmit={async (values) => {
        try {
          setSending(true)

          const payload = {
            user_id: Number(values.userId),
            amount: Number(values.amount),
            due_date: values.dueDate,
            note: values.note || '',
            email_type: EMAIL_TYPE_ID[emailType],
            upi_id: values.upiId,
          }

          await paymentEmailApi(payload)
          toast.success(`Email sent to ${values.email}`)
        } catch (error) {
          console.error(error)
          toast.error('Failed to send payment email')
        } finally {
          setSending(false)
        }
      }}
    >
      {({ values, errors, touched, setFieldValue, setFieldTouched }) => {
        const handleBatchChange = async (batchId: string) => {
          setFieldValue('batchId', batchId)
          setFieldValue('userId', '')
          setFieldValue('name', '')
          setFieldValue('email', '')
          setUsers([])

          if (!batchId) return

          try {
            setLoadingUsers(true)
            const response = await getUserByBatchApi(batchId)
            const payload = response?.data?.data ?? response?.data?.users ?? response?.data
            setUsers(normalizeUsers(payload))
          } catch (error) {
            console.error(error)
            toast.error('Failed to load batch users')
          } finally {
            setLoadingUsers(false)
          }
        }

        const handleCustomerChange = (userId: string) => {
          setFieldValue('userId', userId)
          const selectedUser = users.find((user) => user.id === Number(userId))

          if (selectedUser) {
            setFieldValue('name', selectedUser.name)
            setFieldValue('email', selectedUser.email)
          }
        }

        const titles = previewTitle()

        return (
          <Form className="text-adark send-email-form">
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
                  value={values.batchId}
                  onChange={(e) => void handleBatchChange(e.target.value)}
                  onBlur={() => setFieldTouched('batchId', true)}
                  className="w-full bg-abg3 border border-white/[0.12] rounded-[10px] px-3.5 py-2.5 text-xs text-adark outline-none transition-colors focus:border-gold cursor-pointer"
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
                {errors.batchId && touched.batchId && (
                  <p className="text-red-400 text-[11px] mt-1">{errors.batchId}</p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-5 mb-6">
              {EMAIL_TYPES.map((t) => (
                <button
                  key={t.key}
                  type="button"
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
                    value={values.userId}
                    onChange={(e) => handleCustomerChange(e.target.value)}
                    onBlur={() => setFieldTouched('userId', true)}
                    disabled={!values.batchId || loadingUsers}
                    className="w-full bg-abg3 border border-white/[0.12] rounded-[10px] px-3.5 py-2.5 text-xs text-adark outline-none transition-colors focus:border-gold cursor-pointer disabled:opacity-60"
                  >
                    <option value="">
                      {!values.batchId
                        ? 'Select batch first...'
                        : loadingUsers
                          ? 'Loading users...'
                          : 'Choose batch user...'}
                    </option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} - {user.email}
                      </option>
                    ))}
                  </select>
                  {errors.userId && touched.userId && (
                    <p className="text-red-400 text-[11px] mt-1">{errors.userId}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <FormInput label="NAME" name="name" placeholder="Customer name" variant="admin" />
                  <FormInput label="EMAIL" name="email" type="email" placeholder="customer@example.com" variant="admin" />
                  <FormInput label="AMOUNT (Rs)" name="amount" type="number" placeholder="0" variant="admin" />
                  <div>
                    <label className="text-[11px] tracking-[1px] text-[#8a8aa3] mb-2 block">
                      DUE DATE
                    </label>
                    <input
                      type="date"
                      value={values.dueDate}
                      onChange={(e) => setFieldValue('dueDate', e.target.value)}
                      onBlur={() => setFieldTouched('dueDate', true)}
                      className="w-full h-[46px]  rounded-[12px] bg-transparent border border-white/[0.12] px-4 text-sm text-adark outline-none transition-colors focus:border-gold [color-scheme:dark]"
                    />
                    {errors.dueDate && touched.dueDate && (
                      <p className="text-red-400 text-[11px] mt-1">{errors.dueDate}</p>
                    )}
                  </div>
                  <FormInput label="UPI ID" name="upiId" placeholder="business@upi" variant="admin" />
                </div>

                <div className="mb-5">
                  <label className="block text-[11px] text-[#8a8aa3] uppercase tracking-[0.06em] mb-1.5">
                    Custom Note (optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Add any extra information..."
                    value={values.note}
                    onChange={(e) => setFieldValue('note', e.target.value)}
                    onBlur={() => setFieldTouched('note', true)}
                    className="w-full bg-abg3 border border-white/[0.12] rounded-[10px] px-3.5 py-2.5 text-xs text-adark outline-none transition-colors focus:border-gold resize-y placeholder:text-amuted2"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className={`w-full py-3 rounded-[10px] text-md font-bold transition-all hover:opacity-90 text-white/90 border ${TYPE_ACTIVE[emailType]} disabled:opacity-60`}
                >
                  <span className="flex h-6 w-[120px] items-center justify-center mx-auto">
                    {sending ? <div className="loader-btn loader-btn-sm" /> : 'Send Email ->'}
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
                    To: <span className="text-adark">{values.email || 'customer@example.com'}</span>
                  </p>
                  <p className="text-sm font-bold text-adark mb-3">{titles[emailType]}</p>
                  <p className="text-xs text-amuted mb-3">
                    Dear <span className="text-adark">{values.name || 'Customer'}</span>,
                  </p>
                  <div className={`rounded-[10px] p-3 mb-3 text-center border ${TYPE_COLOR[emailType]}`}>
                    <p className="text-sm text-amuted mb-0.5">Amount Due</p>
                    <p className="text-3xl font-bold">Rs {values.amount ?? 0}</p>
                    {values.dueDate && <p className="text-xs text-amuted mt-1">Due by {values.dueDate}</p>}
                  </div>
                  {values.note && (
                    <p className="text-sm text-amuted bg-white/[0.03] rounded-lg p-2.5">{values.note}</p>
                  )}
                </div>
              </div>
            </div>
          </Form>
        )
      }}
    </Formik>
  )
}

export default SendEmail
