// ── Auth ──────────────────────────────────────────
export interface LoginPayload {
  email: string
  password: string
}

export interface AuthUser {
  id: string
  name: string
  email: string
  user_type: 1 | 2 | 3
  token: string
}

export interface AuthState {
  user: AuthUser | null
  isLoading: boolean
  error: string | null
}

// ── Customer ──────────────────────────────────────
export interface Customer {
  id: number
  name: string
  email: string
  phone: string
  plan: 'Basic' | 'Pro' | 'Enterprise'
  status: 'Active' | 'Inactive' | 'Pending'
}

export interface CustomerState {
  customers: Customer[]
}

// ── Email ──────────────────────────────────────────
export type EmailType = 'invoice' | 'reminder' | 'confirmation' | 'renewal'

export interface EmailHistory {
  id: number
  recipient: string
  email: string
  type: EmailType
  amount: string
  date: string
  status: 'Sent' | 'Pending' | 'Failed'
}

// ── Test ──────────────────────────────────────────
export interface Question {
  section: string
  q: string
  opts: string[]
  ans: number
}

export interface TestData {
  title: string
  subtitle: string
  total: number
  pass: number
  questions: Question[]
}

export interface TestResult {
  testType: TestType
  correct: number
  wrong: number
  skipped: number
  total: number
  passed: boolean
  timeTaken: string
}

export type TestType = 'aptitude' | 'technical'

export interface TestState {
  activeTestType: TestType
  currentQuestion: number
  answers: (number | null)[]
  testStarted: boolean
  testSubmitted: boolean
  result: TestResult | null
  resultsByType: Partial<Record<TestType, TestResult>>
  timeLeft: number
}

// ── Intern ────────────────────────────────────────
export interface InternStep1 {
  fullName: string
  email: string
  phone: string
  password: string
  confirmPassword: string
}

export interface InternStep3 {
  college: string
  degree: string
  year: string
  domain: string
  linkedIn: string
  github: string
}
