
// ── Auth ──────────────────────────────────────────
export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  user_type: 1 | 2 | 3;
  token: string;
}

export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
}


// ── Customer ──────────────────────────────────────
export type PlanType = 'Basic' | 'Pro' | 'Enterprise';
export type CustomerStatus = 'Active' | 'Inactive' | 'Pending';

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  plan: PlanType;
  status: CustomerStatus;
}

export interface CustomerState {
  customers: Customer[];
}


// ── Email ──────────────────────────────────────────
export type EmailType =
  | 'invoice'
  | 'reminder'
  | 'confirmation'
  | 'renewal';

export type EmailStatus = 'Sent' | 'Pending' | 'Failed';

export interface EmailHistory {
  id: number;
  recipient: string;
  email: string;
  type: EmailType;
  amount: string;
  date: string;
  status: EmailStatus;
}


// ── Test ──────────────────────────────────────────
export interface Question {
  section: string;
  q: string;
  opts: string[];
  ans: number;
}

export interface TestData {
  title: string;
  subtitle: string;
  total: number;
  pass: number;
  questions: Question[];
}

export type TestType = 'aptitude' | 'technical';

export interface TestResult {
  testType: TestType;
  correct: number;
  wrong: number;
  skipped: number;
  total: number;
  passed: boolean;
  timeTaken: string;
}

// 🔥 Better type safety
export type ResultsByType = Partial<Record<TestType, TestResult>>;

export interface TestState {
  activeTestType: TestType;
  currentQuestion: number;
  answers: (number | null)[];
  testStarted: boolean;
  testSubmitted: boolean;
  result: TestResult | null;
  resultsByType: ResultsByType;
  timeLeft: number;

  // 🔥 API states
  loading: boolean;
  error: string | null;
}


// ── Intern ────────────────────────────────────────
export interface InternStep1 {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export interface InternStep3 {
  college: string;
  degree: string;
  year: string;
  domain: string;
  linkedIn: string;
  github: string;
}


// ── Signup ────────────────────────────────────────
export interface SignupPayload {
  username: string;
  email: string;
  password: string;
  type: number;
  batch: number;
}