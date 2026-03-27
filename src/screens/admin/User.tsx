import { useState, useEffect } from 'react'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { toast } from 'react-toastify'
import { getAllUsers, getBatchUsers } from '../../services/adminApi'

const schema = Yup.object({
  name: Yup.string().required('Name is required'),
  email: Yup.string().email('Enter valid email').required('Email is required'),
  phone: Yup.string().required('Phone is required'),
})

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
      className={`w-full bg-abg4 border rounded-[10px] px-3.5 py-2.5 text-sm text-adark outline-none
      ${touched && error ? 'border-adanger' : 'border-white/[0.12]'}`}
    />
    {touched && error && <p className="text-[11px] text-adanger mt-1">{error}</p>}
  </div>
)

const User = () => {

  const [customers, setCustomers] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [batch, setBatch] = useState('all')

  const [modalOpen, setModalOpen] = useState(false)

  // 🔥 API Calls
  const fetchAll = async () => {
    try {
      const res = await getAllUsers()
      setCustomers(res.data.data)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchBatch = async (id: number) => {
    try {
      const res = await getBatchUsers(id)
      setCustomers(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [])

  // 🔍 Search
  const filtered = customers.filter(
    (c) =>
      c.username?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase())
  )

  const formik = useFormik({
    initialValues: {
      name: '',
      email: '',
      phone: '',
    },
    validationSchema: schema,
    onSubmit: () => {
      toast.success('Customer added (UI only)')
      setModalOpen(false)
    },
  })

  return (
    <div className="text-adark">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-7">
        <div>
          <h1 className="text-2xl font-extrabold text-adark mb-1">Users</h1>
          <p className="text-sm text-amuted">Manage your User database.</p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 bg-gold text-abg font-bold text-sm rounded-[10px]"
        >
          + Add User
        </button>
      </div>

      {/* 🔥 Search + Batch Dropdown */}
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

            if (val === 'all') fetchAll()
            else fetchBatch(Number(val))
          }}
          className="bg-abg2 border border-white/[0.07] rounded-[10px] px-3 py-2.5 text-sm text-adark"
        >
          <option value="all">All</option>
          <option value="1">Batch 1</option>
          <option value="2">Batch 2</option>
          <option value="3">Batch 2</option>
          <option value="4">Batch 4</option>
          <option value="2">Batch 5</option>
          <option value="6">Batch 6</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-abg2 border border-white/[0.07] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.07]">
                {['Name', 'Phone', 'Batch', 'Fees', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-[11px] text-amuted">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-amuted">
                    No customers found.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.user_id} className="border-b border-white/[0.04]">

                    <td className="px-5 py-3.5">
                      <p className="font-semibold">{c.username}</p>
                      <p className="text-xs text-amuted">{c.email}</p>
                    </td>

                    <td className="px-5 py-3.5 text-amuted">
                      N/A
                    </td>

                    <td className="px-5 py-3.5">
                      {c.batch ?? 'N/A'}
                    </td>

                    <td className="px-5 py-3.5">
                      <input
                        type="number"
                        placeholder="Fees"
                        className="w-20 bg-abg4 border border-white/[0.12] rounded px-2 py-1 text-sm"
                      />
                    </td>

                    <td className="flex px-5 py-3.5 gap-5">
                      <button className="px-3 py-1 text-xs bg-ainfo/10 text-ainfo rounded">
                        Edit
                      </button>
                      <button className="px-3 py-1 text-xs bg-ainfo/10 text-adanger rounded">
                        Delete
                      </button>
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
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center">
          <div className="bg-abg3 p-6 rounded-xl w-full max-w-lg">

            <h2 className="mb-4 font-bold">Add Customer</h2>

            <form onSubmit={formik.handleSubmit} className="space-y-4">

              <ModalInput label="Name" {...formik.getFieldProps('name')} />
              <ModalInput label="Email" {...formik.getFieldProps('email')} />
              <ModalInput label="Phone" {...formik.getFieldProps('phone')} />

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 border px-3 py-2 rounded"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="flex-1 bg-gold px-3 py-2 rounded"
                >
                  Save
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  )
}

export default User;