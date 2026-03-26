import { useState } from 'react'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { toast } from 'react-toastify'
import { useAppDispatch, useAppSelector } from '../../redux/hooks'
import { addCustomer, updateCustomer, deleteCustomer } from '../../redux/slices/customerSlice'
import { Customer } from '../../types'

const schema = Yup.object({
  name:   Yup.string().required('Name is required'),
  email:  Yup.string().email('Enter valid email').required('Email is required'),
  phone:  Yup.string().required('Phone is required'),
  plan:   Yup.mixed<'Basic' | 'Pro' | 'Enterprise'>().oneOf(['Basic', 'Pro', 'Enterprise']).required(),
  status: Yup.mixed<'Active' | 'Inactive' | 'Pending'>().oneOf(['Active', 'Inactive', 'Pending']).required(),
})

const STATUS_CLASSES: Record<string, string> = {
  Active:   'bg-asuccess/10 text-asuccess border border-asuccess/25',
  Inactive: 'bg-adanger/10 text-adanger border border-adanger/25',
  Pending:  'bg-gold/10 text-gold border border-gold/25',
}

const PLAN_CLASSES: Record<string, string> = {
  Basic:      'bg-ainfo/10 text-ainfo',
  Pro:        'bg-asuccess/10 text-asuccess',
  Enterprise: 'bg-gold/10 text-gold',
}

interface ModalInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  touched?: boolean
}

const ModalInput = ({ label, error, touched, ...props }: ModalInputProps) => (
  <div>
    <label className="block text-[11px] text-amuted uppercase tracking-[0.06em] mb-1.5">{label}</label>
    <input
      {...props}
      className={`w-full bg-abg4 border rounded-[10px] px-3.5 py-2.5 text-sm text-adark outline-none transition-colors placeholder:text-amuted2
        ${touched && error ? 'border-adanger focus:border-adanger' : 'border-white/[0.12] focus:border-gold'}`}
    />
    {touched && error && <p className="text-[11px] text-adanger mt-1">{error}</p>}
  </div>
)

const Customers = () => {
  const dispatch = useAppDispatch()
  const { customers } = useAppSelector((s) => s.customers)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [search, setSearch] = useState('')

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()),
  )

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name:   editing?.name   ?? '',
      email:  editing?.email  ?? '',
      phone:  editing?.phone  ?? '',
      plan:   editing?.plan   ?? 'Basic',
      status: editing?.status ?? 'Pending',
    },
    validationSchema: schema,
    onSubmit: (values, { resetForm }) => {
      if (editing) {
        dispatch(updateCustomer({ ...editing, ...values }))
        toast.success('Customer updated')
      } else {
        dispatch(addCustomer(values))
        toast.success('Customer added')
      }
      resetForm()
      setModalOpen(false)
      setEditing(null)
    },
  })

  const openAdd = () => {
    setEditing(null)
    formik.resetForm()
    setModalOpen(true)
  }

  const openEdit = (c: Customer) => {
    setEditing(c)
    setModalOpen(true)
  }

  const handleDelete = (id: number) => {
    dispatch(deleteCustomer(id))
    toast.success('Customer removed')
  }

  const handleClose = () => {
    setModalOpen(false)
    setEditing(null)
    formik.resetForm()
  }

  return (
    <div className=" text-adark">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-7">
        <div>
          <h1 className="text-2xl font-extrabold text-adark mb-1">Customers</h1>
          <p className="text-sm text-amuted">Manage your customer database.</p>
        </div>
        <button
          onClick={openAdd}
          className="px-4 py-2.5 bg-gold hover:bg-goldtxt text-abg font-bold text-sm rounded-[10px] transition-colors whitespace-nowrap"
        >
          + Add Customer
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm mb-4">
        <input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-abg2 border border-white/[0.07] rounded-[10px] pl-9 pr-4 py-2.5 text-sm text-adark outline-none focus:border-gold placeholder:text-amuted2"
        />
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-amuted" width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
          <path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
        </svg>
      </div>

      {/* Table */}
      <div className="bg-abg2 border border-white/[0.07] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.07]">
                {['Name', 'Phone', 'Plan', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-[11px] font-mono uppercase tracking-[0.06em] text-amuted font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-amuted">
                    No customers found.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="border-b border-white/[0.04] hover:bg-abg3 transition-colors">
                    <td className="px-5 py-3.5 align-middle">
                      <p className="font-semibold text-adark leading-none">{c.name}</p>
                      <p className="text-xs text-amuted mt-0.5">{c.email}</p>
                    </td>
                    <td className="px-5 py-3.5 align-middle text-amuted">{c.phone}</td>
                    <td className="px-5 py-3.5 align-middle">
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg ${PLAN_CLASSES[c.plan]}`}>
                        {c.plan}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 align-middle">
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full font-mono ${STATUS_CLASSES[c.status]}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 align-middle">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(c)}
                          className="px-3 py-1 bg-ainfo/10 text-ainfo text-xs font-bold rounded-lg hover:bg-ainfo/20 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="px-3 py-1 bg-adanger/10 text-adanger text-xs font-bold rounded-lg hover:bg-adanger/20 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
        >
          <div className="bg-abg3 border border-white/[0.07] rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-base font-extrabold text-adark mb-5">
              {editing ? 'Edit Customer' : 'Add Customer'}
            </h2>

            <form onSubmit={formik.handleSubmit} noValidate className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ModalInput label="Name"  placeholder="Full name"         {...formik.getFieldProps('name')}  error={formik.errors.name}  touched={formik.touched.name} />
                <ModalInput label="Email" placeholder="email@example.com" type="email" {...formik.getFieldProps('email')} error={formik.errors.email} touched={formik.touched.email} />
                <ModalInput label="Phone" placeholder="+91 XXXXX XXXXX"   {...formik.getFieldProps('phone')} error={formik.errors.phone} touched={formik.touched.phone} />

                <div>
                  <label className="block text-[11px] text-amuted font-mono uppercase tracking-[0.06em] mb-1.5">Plan</label>
                  <select
                    {...formik.getFieldProps('plan')}
                    className="w-full bg-abg4 border border-white/[0.12] rounded-[10px] px-3.5 py-2.5 text-sm text-adark font-syne outline-none focus:border-gold cursor-pointer"
                  >
                    <option value="Basic">Basic</option>
                    <option value="Pro">Pro</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] text-amuted font-mono uppercase tracking-[0.06em] mb-1.5">Status</label>
                  <select
                    {...formik.getFieldProps('status')}
                    className="w-full bg-abg4 border border-white/[0.12] rounded-[10px] px-3.5 py-2.5 text-sm text-adark font-syne outline-none focus:border-gold cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 py-2.5 bg-transparent border border-white/[0.12] rounded-[10px] text-sm font-semibold text-amuted hover:text-adark transition-colors font-syne"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gold hover:bg-goldtxt text-abg font-bold text-sm rounded-[10px] transition-colors font-syne"
                >
                  {editing ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Customers
