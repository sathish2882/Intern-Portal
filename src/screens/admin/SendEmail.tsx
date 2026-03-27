import { useState } from 'react'
import { toast } from 'react-toastify'
import { useAppSelector } from '../../redux/hooks'
import { EmailType } from '../../types'

const EMAIL_TYPES: { key: EmailType; label: string }[] = [
  { key: 'invoice',      label: 'Invoice'      },
  { key: 'reminder',     label: 'Reminder'     },
  { key: 'confirmation', label: 'Confirmation' },
  { key: 'renewal',      label: 'Renewal'      },
]

const TYPE_COLOR: Record<EmailType, string> = {
  invoice:      'text-gold border-gold bg-gold/10',
  reminder:     'text-ainfo border-ainfo bg-ainfo/10',
  confirmation: 'text-asuccess border-asuccess bg-asuccess/10',
  renewal:      'text-adanger border-adanger bg-adanger/10',
}

const TYPE_ACTIVE: Record<EmailType, string> = {
  invoice:      'bg-gold text-abg border-gold',
  reminder:     'bg-ainfo text-white border-ainfo',
  confirmation: 'bg-asuccess text-abg border-asuccess',
  renewal:      'bg-adanger text-white border-adanger',
}

interface AdminInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
}

const AdminInput = ({ label, ...props }: AdminInputProps) => (
  <div>
    <label className="block text-xs text-adark  uppercase tracking-[0.06em] mb-1.5">{label}</label>
    <input
      {...props}
      className="w-full bg-abg3 border border-white/[0.12] rounded-[10px] px-3.5 py-2.5 text-xs text-amuted  outline-none transition-colors focus:border-gold placeholder:text-amuted2"
    />
  </div>
)

const SendEmail = () => {
  const { customers } = useAppSelector((s) => s.customers)
  const [emailType, setEmailType] = useState<EmailType>('invoice')
  const [form, setForm] = useState({
    name: '', email: '', amount: '', invoiceNo: '',
    dueDate: '', upiId: 'business@upi', payLink: '', note: '',
  })

  const set = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }))

  const handleCustomer = (id: string) => {
    const c = customers.find((x) => x.id === Number(id))
    if (c) { set('name', c.name); set('email', c.email) }
  }

  const handleSend = () => {
    if (!form.name || !form.email || !form.amount) {
      toast.error('Please fill Name, Email and Amount')
      return
    }
    toast.success(`Email sent to ${form.email}`)
  }

  const previewTitle: Record<EmailType, string> = {
    invoice:      `Invoice ${form.invoiceNo || '#INV-0001'}`,
    reminder:     'Payment Reminder',
    confirmation: 'Payment Confirmation',
    renewal:      'Renewal Notice',
  }

  return (
    <div className="text-adark">
      <h1 className="text-2xl font-extrabold text-adark mb-1">Send Email</h1>
      <p className="text-sm text-amuted mb-6">Compose and send payment emails to your customers.</p>

      {/* Type tabs */}
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

        {/* Form */}
        <div className="bg-abg2 border border-white/[0.07] rounded-2xl p-5">
          <h2 className="text-lg font-bold text-adark mb-4">Email Details</h2>

          {/* Customer selector */}
          <div className="mb-4">
            <label className="block text-xs text-adark uppercase tracking-[0.06em] mb-1.5">
              Select Customer
            </label>
            <select
              onChange={(e) => handleCustomer(e.target.value)}
              className="w-full bg-abg3 border border-white/[0.12] rounded-[10px] px-3.5 py-2.5 text-xs text-amuted  outline-none focus:border-gold cursor-pointer"
            >
              <option value="" className='text-base'>Choose existing customer...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name} — {c.email}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <AdminInput label="Name"         placeholder="Customer name"        value={form.name}      onChange={(e) => set('name', e.target.value)} />
            <AdminInput label="Email"        placeholder="customer@example.com" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
            <AdminInput label="Amount (₹)"  placeholder="0"                    type="number" value={form.amount} onChange={(e) => set('amount', e.target.value)} />
            <AdminInput label="Invoice No."  placeholder="INV-0001"             value={form.invoiceNo} onChange={(e) => set('invoiceNo', e.target.value)} />
            <AdminInput label="Due Date"     type="date"                        value={form.dueDate}   onChange={(e) => set('dueDate', e.target.value)} />
            <AdminInput label="UPI ID"       value={form.upiId}                 onChange={(e) => set('upiId', e.target.value)} />
          </div>

          <div className="mb-3">
            <AdminInput label="Payment Link (optional)" placeholder="https://pay.example.com/..." value={form.payLink} onChange={(e) => set('payLink', e.target.value)} />
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
              className="w-full bg-abg3 border border-white/[0.12] rounded-[10px] px-3.5 py-2.5 text-xs text-amuted  outline-none focus:border-gold resize-y placeholder:text-amuted2"
            />
          </div>

          <button
            onClick={handleSend}
            className={`w-full py-3 rounded-[10px] text-md font-bold transition-all hover:opacity-90 text-white/90 text-semibold border ${TYPE_ACTIVE[emailType]}`}
          >
            Send Email ↗
          </button>
        </div>

        {/* Preview */}
        <div className="bg-abg2 border border-white/[0.07] rounded-2xl p-5">
          <h2 className="text-lg font-bold text-adark mb-4">Preview</h2>
          <div className="bg-abg3 border border-white/[0.07] rounded-xl p-4">
            {/* Email header */}
            <div className="flex items-center gap-3 pb-3 mb-3 border-b border-white/[0.07]">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold text-abg ${TYPE_ACTIVE[emailType].split(' ')[0]}`}>
                💰
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
            {/* Amount box */}
            <div className={`rounded-[10px] p-3 mb-3 text-center border ${TYPE_COLOR[emailType]}`}>
              <p className="text-sm text-amuted mb-0.5">Amount Due</p>
              <p className="text-3xl font-bold">₹{form.amount || '0'}</p>
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

export default SendEmail;
