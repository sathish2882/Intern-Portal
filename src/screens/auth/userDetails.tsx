import React, { useEffect, useRef, useState } from 'react'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import {
  getUserByIdApi,
  saveUserDetailsApi,
  getMeApi,
} from '../../services/authApi'
import {
  getUserId,
  getToken,
  isExamUser,
} from '../../utils/authCookies'

const UserDetails: React.FC = () => {
  const nameRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const userId = getUserId()
  const token = getToken()

  const formik = useFormik({
    initialValues: {
      name: '',
      email: '',
    },
    validationSchema: Yup.object({
      name: Yup.string().required('Name is required'),
      email: Yup.string()
        .email('Please enter a valid email')
        .required('Email is required'),
    }),
    onSubmit: async (values) => {
      try {
        setLoading(true)

        // 🔴 EXAM USER
        if (isExamUser()) {
          if (!userId) {
            toast.error('User ID not found. Please login again.')
            navigate('/login', { replace: true })
            return
          }

          await saveUserDetailsApi(userId, values)
        }

        // 🟢 NORMAL USER
        else if (token) {
          await saveUserDetailsApi(userId as string, values)
          // 👉 OR use normal API if backend has separate endpoint
        }

        toast.success('Details saved successfully')
        navigate('/user/dashboard', { replace: true })
      } catch (error: any) {
        const message =
          error?.response?.data?.detail ||
          'Failed to save details'
        toast.error(message)
      } finally {
        setLoading(false)
      }
    },
  })

  useEffect(() => {
    const loadUser = async () => {
      try {
        let response

        // 🔴 EXAM USER
        if (isExamUser()) {
          if (!userId) {
            navigate('/login', { replace: true })
            return
          }

          response = await getUserByIdApi(userId)
        }

        // 🟢 NORMAL USER
        else if (token) {
          response = await getMeApi()
        }

        const payload = response?.data ?? {}

        formik.setValues({
          name: String(payload.name ?? payload.username ?? ''),
          email: String(payload.email ?? ''),
        })
      } catch (error) {
        console.error(error)
      }
    }

    void loadUser()
  }, [navigate, userId, token])

  const handleFocus = () => {
    if (formik.errors.name) {
      nameRef.current?.focus()
    } else if (formik.errors.email) {
      emailRef.current?.focus()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">
          User Details
        </h1>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            formik.handleSubmit()
            handleFocus()
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium mb-1">
              Name/Username
            </label>
            <input
              ref={nameRef}
              type="text"
              {...formik.getFieldProps('name')}
              placeholder="Enter your name"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                formik.touched.name && formik.errors.name
                  ? 'border-red-500 focus:ring-red-400'
                  : 'border-gray-300 focus:ring-blue-400'
              }`}
            />
            {formik.touched.name && formik.errors.name && (
              <p className="text-red-500 text-sm mt-1">
                {formik.errors.name}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              ref={emailRef}
              type="email"
              {...formik.getFieldProps('email')}
              placeholder="Enter your email"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                formik.touched.email && formik.errors.email
                  ? 'border-red-500 focus:ring-red-400'
                  : 'border-gray-300 focus:ring-blue-400'
              }`}
            />
            {formik.touched.email && formik.errors.email && (
              <p className="text-red-500 text-sm mt-1">
                {formik.errors.email}
              </p>
            )}
          </div>

          <div className="flex w-full justify-center">
            <button
              type="submit"
              disabled={loading}
              className="w-1/2 bg-blue-500 text-black py-2 rounded-lg border border-blue hover:bg-blue hover:text-white transition duration-200 disabled:opacity-70"
            >
              <span className="flex items-center justify-center min-h-6">
                {loading ? (
                  <div className="loader-btn loader-btn-sm" />
                ) : (
                  'Submit'
                )}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UserDetails