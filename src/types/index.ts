
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

export interface CurrentUserProfile {
  user_id: number;
  username: string;
  email: string;
  phno?: string | null;
  phone?: string | null;
  batch: number | string | null;
  tech_stack: string | null;
  total_fee?: number;
  paid_amount?: number;
  due_amount?: number;
  type?: 1 | 2 | 3;
  status?: number;
  is2FA?: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}


// ── Customer ──────────────────────────────────────

// Role options
export type RoleType = 'Frontend' | 'Backend' | 'Others';


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

// 🔥 Backend API Result (from /users/{id}/test-status)
export interface BackendTestResult {
  attempt_id: number;
  status: "in_progress" | "completed";
  aptitude_score: number;
  technical_score: number;
  total_score: number;
  percentage: number;
  submitted_at: string;
}

// 🔥 Better type safety
export type ResultsByType = Partial<Record<TestType, TestResult>>;

// 🔥 Current User Profile
export interface UserProfile {
  name: string;
  email: string;
}

export interface TestState {
  activeTestType: TestType;
  currentQuestion: number;
  answers: (number | null)[];
  testStarted: boolean;
  testSubmitted: boolean;
  result: TestResult | null;
  resultsByType: ResultsByType;
  timeLeft: number;

  // 🔥 Backend Result (from API) - SINGLE SOURCE OF TRUTH
  backendResult: BackendTestResult | null;

  // 🔥 Current User Profile
  currentUser: UserProfile | null;

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
