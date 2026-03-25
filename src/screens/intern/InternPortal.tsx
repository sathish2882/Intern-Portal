import { useState } from 'react'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { toast } from 'react-toastify'
import { Link, useNavigate } from 'react-router-dom'

// ── Step config ────────────────────────────────────────────────────────────
const STEPS = ['Register', 'Verify', 'Details', 'Payment', 'Done']

// ── Validation schemas ─────────────────────────────────────────────────────
const step1Schema = Yup.object({
  fullName:        Yup.string().min(3, 'At least 3 characters').required('Full name is required'),
  email:           Yup.string().email('Enter a valid email').required('Email is required'),
  phone:           Yup.string().matches(/^[6-9]\d{9}$/, 'Enter valid 10-digit number').required('Phone is required'),
  password:        Yup.string().min(8, 'Minimum 8 characters').required('Password is required'),
  confirmPassword: Yup.string().oneOf([Yup.ref('password')], 'Passwords do not match').required('Please confirm password'),
})

const step3Schema = Yup.object({
  college: Yup.string().required('College name is required'),
  degree:  Yup.string().required('Degree is required'),
  year:    Yup.string().required('Year is required'),
  domain:  Yup.string().required('Preferred domain is required'),
})

// ── Reusable field component ───────────────────────────────────────────────
interface FieldProps {
  label: string
  error?: string
  touched?: boolean
  children: React.ReactNode
}

const Field = ({ label, error, touched, children }: FieldProps) => (
  <div>
    <label className="block text-[11px] font-bold text-slate uppercase tracking-[0.5px] mb-1.5 font-jakarta">
      {label}
    </label>
    {children}
    {touched && error && (
      <p className="text-xs text-danger mt-1">{error}</p>
    )}
  </div>
)

// ── Step indicator ─────────────────────────────────────────────────────────
const StepBar = ({ current }: { current: number }) => (
  <div className="flex items-center max-w-[560px] mx-auto w-full mb-8">
    {STEPS.map((label, i) => (
      <div key={label} className="flex-1 flex flex-col items-center relative">
        {/* Connector line */}
        {i < STEPS.length - 1 && (
          <div className={`absolute top-[18px] left-1/2 right-[-50%] h-0.5 transition-colors duration-500 ${i < current ? 'bg-blue' : 'bg-line'}`} />
        )}
        {/* Circle */}
        <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-[13px] font-bold z-10 transition-all duration-300
          ${i < current  ? 'bg-blue border-blue text-white'
          : i === current ? 'border-blue text-blue bg-white shadow-[0_0_0_4px_rgba(29,110,222,0.15)]'
          : 'border-line text-mist bg-white'}`}
        >
          {i < current ? '✓' : i + 1}
        </div>
        {/* Label */}
        <span className={`text-[11px] mt-1.5 font-semibold font-jakarta ${i === current ? 'text-navy' : i < current ? 'text-blue' : 'text-mist'}`}>
          {label}
        </span>
      </div>
    ))}
  </div>
)

// ── OTP input ──────────────────────────────────────────────────────────────
const OtpInput = ({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) => {
  const handleChange = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return
    const next = [...value]
    next[i] = val
    onChange(next)
    if (val && i < 5) {
      const el = document.getElementById(`otp-${i + 1}`)
      el?.focus()
    }
  }
  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !value[i] && i > 0) {
      document.getElementById(`otp-${i - 1}`)?.focus()
    }
  }
  return (
    <div className="flex gap-3 justify-center">
      {value.map((v, i) => (
        <input
          key={i}
          id={`otp-${i}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={v}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          className={`w-11 h-12 text-center text-lg font-bold border-2 rounded-xl outline-none transition-all duration-200 font-mono text-navy
            bg-lightbg focus:border-blue focus:bg-white focus:shadow-[0_0_0_3px_rgba(29,110,222,0.10)]
            ${v ? 'border-blue bg-sky' : 'border-line'}`}
        />
      ))}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────
const InternPortal = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [otp, setOtp]   = useState(['', '', '', '', '', ''])
  const [otpError, setOtpError] = useState('')
  const [regData, setRegData]   = useState({ fullName: '', email: '', phone: '' })
  const [passStrength, setPassStrength] = useState(0)

  // ── Step 1 — Register ──────────────────────────────────────────────────
  const step1 = useFormik({
    initialValues: { fullName: '', email: '', phone: '', password: '', confirmPassword: '' },
    validationSchema: step1Schema,
    onSubmit: (values) => {
      setRegData({ fullName: values.fullName, email: values.email, phone: values.phone })
      toast.success('Account created! Check your email for OTP.')
      setStep(1)
    },
  })

  const checkStrength = (val: string) => {
    let score = 0
    if (val.length >= 8) score++
    if (/[A-Z]/.test(val)) score++
    if (/[0-9]/.test(val)) score++
    if (/[^A-Za-z0-9]/.test(val)) score++
    setPassStrength(score)
  }

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong']
  const strengthColor = ['', 'bg-danger', 'bg-[#e07b00]', 'bg-blue', 'bg-asuccess']

  // ── Step 2 — OTP Verify ────────────────────────────────────────────────
  const handleVerify = () => {
    const code = otp.join('')
    if (code.length < 6) { setOtpError('Please enter all 6 digits'); return }
    // Static demo: accept any 6-digit OTP
    setOtpError('')
    toast.success('Email verified successfully!')
    setStep(2)
  }

  // ── Step 3 — Details ──────────────────────────────────────────────────
  const step3 = useFormik({
    initialValues: { college: '', degree: '', year: '', domain: '', linkedIn: '', github: '' },
    validationSchema: step3Schema,
    onSubmit: () => {
      toast.success('Details saved!')
      setStep(3)
    },
  })

  // ── Step 4 — Payment ──────────────────────────────────────────────────
  const handlePayment = () => {
    toast.success('Payment successful! Registration complete.')
    setStep(4)
  }

  return (
    <div className="min-h-screen bg-lightbg font-jakarta text-navy">

      {/* Header */}
      <header className="bg-white border-b border-line px-4 lg:px-10 py-4 flex items-center gap-3 sticky top-0 z-50">
        <div className="w-9 h-9 bg-gradient-to-br from-blue to-[#6b49e8] rounded-xl flex items-center justify-center text-lg">
          🎓
        </div>
        <div>
          <p className="text-[16px] font-extrabold text-navy tracking-tight leading-none">M-Guru</p>
          <p className="text-[10px] text-mist tracking-widest uppercase font-mono">Internship Portal</p>
        </div>
        <div className="ml-auto">
          <Link to="/login" className="text-[13px] text-blue font-semibold hover:underline">
            Already registered? Sign In →
          </Link>
        </div>
      </header>

      <div className="max-w-[680px] mx-auto px-4 py-8 lg:py-12">

        {/* Step bar */}
        <StepBar current={step} />

        {/* ── STEP 0: Register ── */}
        {step === 0 && (
          <div className="bg-white border border-line rounded-2xl p-6 sm:p-8 shadow-[0_4px_24px_rgba(13,27,46,0.07)] animate-fadeUp">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-5 h-0.5 bg-blue rounded inline-block" />
                <span className="text-[11px] font-bold text-blue tracking-[1.5px] uppercase">Step 1 of 5</span>
              </div>
              <h2 className="text-2xl font-extrabold text-navy tracking-tight">Create Your Account</h2>
              <p className="text-sm text-slate mt-1">Fill in your basic details to get started.</p>
            </div>

            <form onSubmit={step1.handleSubmit} noValidate className="space-y-4">
              <Field label="Full Name" error={step1.errors.fullName} touched={step1.touched.fullName}>
                <div className="relative">
                  <input
                    placeholder="e.g. Priya Sharma"
                    className={`w-full bg-lightbg border rounded-[10px] py-3 pl-11 pr-4 text-sm text-navy placeholder-mist outline-none transition-all
                      focus:bg-white focus:border-blue focus:shadow-[0_0_0_3px_rgba(29,110,222,0.10)]
                      ${step1.touched.fullName && step1.errors.fullName ? 'border-danger' : 'border-line'}`}
                    {...step1.getFieldProps('fullName')}
                  />
                  <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mist" width="15" height="15" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                  </svg>
                </div>
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Email Address" error={step1.errors.email} touched={step1.touched.email}>
                  <input
                    type="email"
                    placeholder="you@email.com"
                    className={`w-full bg-lightbg border rounded-[10px] py-3 px-4 text-sm text-navy placeholder-mist outline-none transition-all
                      focus:bg-white focus:border-blue focus:shadow-[0_0_0_3px_rgba(29,110,222,0.10)]
                      ${step1.touched.email && step1.errors.email ? 'border-danger' : 'border-line'}`}
                    {...step1.getFieldProps('email')}
                  />
                </Field>

                <Field label="Phone Number" error={step1.errors.phone} touched={step1.touched.phone}>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    className={`w-full bg-lightbg border rounded-[10px] py-3 px-4 text-sm text-navy placeholder-mist outline-none transition-all
                      focus:bg-white focus:border-blue focus:shadow-[0_0_0_3px_rgba(29,110,222,0.10)]
                      ${step1.touched.phone && step1.errors.phone ? 'border-danger' : 'border-line'}`}
                    {...step1.getFieldProps('phone')}
                  />
                </Field>
              </div>

              <Field label="Create Password" error={step1.errors.password} touched={step1.touched.password}>
                <input
                  type="password"
                  placeholder="Min. 8 characters"
                  className={`w-full bg-lightbg border rounded-[10px] py-3 px-4 text-sm text-navy placeholder-mist outline-none transition-all
                    focus:bg-white focus:border-blue focus:shadow-[0_0_0_3px_rgba(29,110,222,0.10)]
                    ${step1.touched.password && step1.errors.password ? 'border-danger' : 'border-line'}`}
                  {...step1.getFieldProps('password')}
                  onChange={(e) => {
                    step1.handleChange(e)
                    checkStrength(e.target.value)
                  }}
                />
                {step1.values.password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((n) => (
                        <div key={n} className={`h-1 flex-1 rounded-full transition-all ${passStrength >= n ? strengthColor[passStrength] : 'bg-line'}`} />
                      ))}
                    </div>
                    <p className={`text-[11px] font-semibold ${passStrength >= 3 ? 'text-asuccess' : passStrength >= 2 ? 'text-[#e07b00]' : 'text-danger'}`}>
                      {strengthLabel[passStrength]}
                    </p>
                  </div>
                )}
              </Field>

              <Field label="Confirm Password" error={step1.errors.confirmPassword} touched={step1.touched.confirmPassword}>
                <input
                  type="password"
                  placeholder="Re-enter password"
                  className={`w-full bg-lightbg border rounded-[10px] py-3 px-4 text-sm text-navy placeholder-mist outline-none transition-all
                    focus:bg-white focus:border-blue focus:shadow-[0_0_0_3px_rgba(29,110,222,0.10)]
                    ${step1.touched.confirmPassword && step1.errors.confirmPassword ? 'border-danger' : 'border-line'}`}
                  {...step1.getFieldProps('confirmPassword')}
                />
              </Field>

              <button
                type="submit"
                className="w-full bg-blue hover:bg-bluelt text-white font-bold text-[15px] py-3.5 rounded-[10px] mt-2 transition-all shadow-[0_4px_16px_rgba(29,110,222,0.28)] hover:shadow-[0_6px_24px_rgba(29,110,222,0.35)] hover:-translate-y-px"
              >
                Create Account & Send OTP →
              </button>
            </form>
          </div>
        )}

        {/* ── STEP 1: Verify OTP ── */}
        {step === 1 && (
          <div className="bg-white border border-line rounded-2xl p-6 sm:p-8 shadow-[0_4px_24px_rgba(13,27,46,0.07)] animate-fadeUp">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-5 h-0.5 bg-blue rounded inline-block" />
                <span className="text-[11px] font-bold text-blue tracking-[1.5px] uppercase">Step 2 of 5</span>
              </div>
              <h2 className="text-2xl font-extrabold text-navy tracking-tight">Verify Your Email</h2>
              <p className="text-sm text-slate mt-1">
                We sent a 6-digit OTP to{' '}
                <span className="font-semibold text-navy">{regData.email}</span>
              </p>
            </div>

            <div className="space-y-6">
              <OtpInput value={otp} onChange={setOtp} />

              {otpError && (
                <p className="text-center text-sm text-danger font-medium">{otpError}</p>
              )}

              <div className="bg-sky border border-[#ccdff8] rounded-xl p-4 text-center">
                <p className="text-[13px] text-blue font-semibold">Demo: Enter any 6 digits</p>
                <p className="text-xs text-slate mt-0.5">e.g. 1 2 3 4 5 6</p>
              </div>

              <button
                onClick={handleVerify}
                className="w-full bg-blue hover:bg-bluelt text-white font-bold text-[15px] py-3.5 rounded-[10px] transition-all shadow-[0_4px_16px_rgba(29,110,222,0.28)] hover:-translate-y-px"
              >
                Verify OTP →
              </button>

              <button
                onClick={() => { setOtp(['','','','','','']); setOtpError(''); toast.info('OTP resent!'); }}
                className="w-full text-center text-[13px] text-blue font-semibold hover:underline"
              >
                Resend OTP
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Details ── */}
        {step === 2 && (
          <div className="bg-white border border-line rounded-2xl p-6 sm:p-8 shadow-[0_4px_24px_rgba(13,27,46,0.07)] animate-fadeUp">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-5 h-0.5 bg-blue rounded inline-block" />
                <span className="text-[11px] font-bold text-blue tracking-[1.5px] uppercase">Step 3 of 5</span>
              </div>
              <h2 className="text-2xl font-extrabold text-navy tracking-tight">Academic Details</h2>
              <p className="text-sm text-slate mt-1">Tell us about your education and interests.</p>
            </div>

            <form onSubmit={step3.handleSubmit} noValidate className="space-y-4">
              <Field label="College / University" error={step3.errors.college} touched={step3.touched.college}>
                <input
                  placeholder="e.g. Anna University"
                  className={`w-full bg-lightbg border rounded-[10px] py-3 px-4 text-sm text-navy placeholder-mist outline-none transition-all
                    focus:bg-white focus:border-blue focus:shadow-[0_0_0_3px_rgba(29,110,222,0.10)]
                    ${step3.touched.college && step3.errors.college ? 'border-danger' : 'border-line'}`}
                  {...step3.getFieldProps('college')}
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Degree" error={step3.errors.degree} touched={step3.touched.degree}>
                  <select
                    className={`w-full bg-lightbg border rounded-[10px] py-3 px-4 text-sm text-navy outline-none transition-all cursor-pointer
                      focus:bg-white focus:border-blue focus:shadow-[0_0_0_3px_rgba(29,110,222,0.10)]
                      ${step3.touched.degree && step3.errors.degree ? 'border-danger' : 'border-line'}`}
                    {...step3.getFieldProps('degree')}
                  >
                    <option value="">Select degree</option>
                    <option>B.E / B.Tech</option>
                    <option>Diploma</option>
                    <option>B.Sc</option>
                    <option>BCA</option>
                    <option>MCA</option>
                    <option>M.Tech</option>
                    <option>Other</option>
                  </select>
                </Field>

                <Field label="Current Year" error={step3.errors.year} touched={step3.touched.year}>
                  <select
                    className={`w-full bg-lightbg border rounded-[10px] py-3 px-4 text-sm text-navy outline-none transition-all cursor-pointer
                      focus:bg-white focus:border-blue focus:shadow-[0_0_0_3px_rgba(29,110,222,0.10)]
                      ${step3.touched.year && step3.errors.year ? 'border-danger' : 'border-line'}`}
                    {...step3.getFieldProps('year')}
                  >
                    <option value="">Select year</option>
                    <option>1st Year</option>
                    <option>2nd Year</option>
                    <option>3rd Year</option>
                    <option>Final Year</option>
                    <option>Passed Out</option>
                  </select>
                </Field>
              </div>

              <Field label="Preferred Domain" error={step3.errors.domain} touched={step3.touched.domain}>
                <select
                  className={`w-full bg-lightbg border rounded-[10px] py-3 px-4 text-sm text-navy outline-none transition-all cursor-pointer
                    focus:bg-white focus:border-blue focus:shadow-[0_0_0_3px_rgba(29,110,222,0.10)]
                    ${step3.touched.domain && step3.errors.domain ? 'border-danger' : 'border-line'}`}
                  {...step3.getFieldProps('domain')}
                >
                  <option value="">Select domain</option>
                  <option>Frontend Development</option>
                  <option>Backend Development</option>
                  <option>Full Stack Development</option>
                  <option>UI / UX Design</option>
                  <option>Data Science / ML</option>
                  <option>DevOps / Cloud</option>
                  <option>Mobile Development</option>
                </select>
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="LinkedIn (optional)">
                  <input
                    placeholder="linkedin.com/in/username"
                    className="w-full bg-lightbg border border-line rounded-[10px] py-3 px-4 text-sm text-navy placeholder-mist outline-none transition-all focus:bg-white focus:border-blue focus:shadow-[0_0_0_3px_rgba(29,110,222,0.10)]"
                    {...step3.getFieldProps('linkedIn')}
                  />
                </Field>
                <Field label="GitHub (optional)">
                  <input
                    placeholder="github.com/username"
                    className="w-full bg-lightbg border border-line rounded-[10px] py-3 px-4 text-sm text-navy placeholder-mist outline-none transition-all focus:bg-white focus:border-blue focus:shadow-[0_0_0_3px_rgba(29,110,222,0.10)]"
                    {...step3.getFieldProps('github')}
                  />
                </Field>
              </div>

              <button
                type="submit"
                className="w-full bg-blue hover:bg-bluelt text-white font-bold text-[15px] py-3.5 rounded-[10px] mt-2 transition-all shadow-[0_4px_16px_rgba(29,110,222,0.28)] hover:-translate-y-px"
              >
                Save & Continue →
              </button>
            </form>
          </div>
        )}

        {/* ── STEP 3: Payment ── */}
        {step === 3 && (
          <div className="bg-white border border-line rounded-2xl p-6 sm:p-8 shadow-[0_4px_24px_rgba(13,27,46,0.07)] animate-fadeUp">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-5 h-0.5 bg-blue rounded inline-block" />
                <span className="text-[11px] font-bold text-blue tracking-[1.5px] uppercase">Step 4 of 5</span>
              </div>
              <h2 className="text-2xl font-extrabold text-navy tracking-tight">Registration Fee</h2>
              <p className="text-sm text-slate mt-1">One-time fee to activate your internship account.</p>
            </div>

            {/* Fee card */}
            <div className="bg-gradient-to-br from-sky to-[#deeeff] border border-[#ccdff8] rounded-xl p-5 mb-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-slate">Internship Registration</span>
                <span className="bg-[#ecfdf5] text-asuccess text-xs font-bold px-2 py-0.5 rounded-full">One-time</span>
              </div>
              <p className="text-4xl font-extrabold text-navy tracking-tight">₹499</p>
              <p className="text-xs text-slate mt-1">Includes: Portal access, assessments, certificate</p>
            </div>

            {/* What's included */}
            <div className="space-y-2.5 mb-6">
              {[
                'Full access to Aptitude Portal',
                'Coding tests — Python & React',
                'Performance certificate on completion',
                'Priority placement assistance',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2.5 text-sm text-slate">
                  <div className="w-5 h-5 rounded-full bg-[#ecfdf5] flex items-center justify-center flex-shrink-0">
                    <svg width="11" height="11" fill="#0ea86a" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  </div>
                  {item}
                </div>
              ))}
            </div>

            {/* QR code demo */}
            <div className="border border-line rounded-xl p-4 mb-5 flex items-center gap-4">
              <div className="w-20 h-20 bg-lightbg border border-line rounded-xl flex items-center justify-center flex-shrink-0">
                <div className="grid grid-cols-4 gap-0.5">
                  {Array(16).fill(0).map((_, i) => (
                    <div key={i} className={`w-2.5 h-2.5 rounded-sm ${Math.random() > 0.4 ? 'bg-navy' : 'bg-transparent'}`} />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-bold text-navy mb-0.5">Scan to Pay</p>
                <p className="text-xs text-slate font-mono">UPI: mguru@upi</p>
                <p className="text-xs text-mist mt-1">Or pay via card below</p>
              </div>
            </div>

            <button
              onClick={handlePayment}
              className="w-full bg-blue hover:bg-bluelt text-white font-bold text-[15px] py-3.5 rounded-[10px] transition-all shadow-[0_4px_16px_rgba(29,110,222,0.28)] hover:-translate-y-px"
            >
              Pay ₹499 & Complete Registration →
            </button>
            <p className="text-center text-xs text-mist mt-3">🔒 Secured by Razorpay · SSL encrypted</p>
          </div>
        )}

        {/* ── STEP 4: Done ── */}
        {step === 4 && (
          <div className="bg-white border border-line rounded-2xl p-6 sm:p-10 shadow-[0_4px_24px_rgba(13,27,46,0.07)] text-center animate-fadeUp">
            <div className="text-6xl mb-5">🎉</div>
            <h2 className="text-2xl font-extrabold text-navy tracking-tight mb-2">
              Registration Complete!
            </h2>
            <p className="text-sm text-slate mb-6 max-w-xs mx-auto leading-relaxed">
              Welcome to M-Guru,{' '}
              <span className="font-semibold text-navy">{regData.fullName}</span>! Your account is active.
              Sign in to start your assessments.
            </p>

            {/* Summary */}
            <div className="bg-lightbg border border-line rounded-xl p-4 mb-6 text-left space-y-2">
              {[
                { label: 'Name',   value: regData.fullName },
                { label: 'Email',  value: regData.email    },
                { label: 'Phone',  value: regData.phone    },
                { label: 'Status', value: '✅ Active'       },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between text-sm">
                  <span className="text-mist font-mono text-xs uppercase tracking-wider">{row.label}</span>
                  <span className="font-semibold text-navy">{row.value}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate('/login')}
                className="flex-1 bg-blue hover:bg-bluelt text-white font-bold py-3 rounded-[10px] transition-all shadow-[0_4px_16px_rgba(29,110,222,0.28)] hover:-translate-y-px"
              >
                Sign In to Portal →
              </button>
              <button
                onClick={() => { setStep(0); setOtp(['','','','','','']); }}
                className="flex-1 bg-white border border-line hover:border-blue hover:text-blue text-slate font-bold py-3 rounded-[10px] transition-all"
              >
                Register Another
              </button>
            </div>
          </div>
        )}

        {/* Back button for steps 1-3 */}
        {step > 0 && step < 4 && (
          <button
            onClick={() => setStep(step - 1)}
            className="flex items-center gap-1.5 text-sm text-slate hover:text-blue transition-colors mx-auto mt-5"
          >
            <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
            Back to previous step
          </button>
        )}
      </div>
    </div>
  )
}

export default InternPortal
