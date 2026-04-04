import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMeApi } from '../../services/authApi'
import { capitalizeName } from '../../utils/formatName'
import {
  FiClock,
  FiCalendar,
  FiCheckCircle,
  FiTarget,
  FiMessageSquare,
  FiArrowRight,
  FiSun,
  FiMoon,
  FiSunrise,
  FiZap,
  FiAward,
} from 'react-icons/fi'
import { FaTasks } from 'react-icons/fa'

// ── Types ──────────────────────────────────────────
interface TaskItem {
  id: string
  title: string
  status: 'not-started' | 'in-progress' | 'paused' | 'completed'
  elapsedSeconds: number
  createdAt: number
}

// ── Helpers ────────────────────────────────────────
const getGreeting = () => {
  const h = new Date().getHours()
  if (h < 12) return { text: 'Good Morning', icon: <FiSunrise className="text-amber-400" /> }
  if (h < 17) return { text: 'Good Afternoon', icon: <FiSun className="text-orange-400" /> }
  return { text: 'Good Evening', icon: <FiMoon className="text-indigo-400" /> }
}

const loadTasks = (): TaskItem[] => {
  try {
    const raw = localStorage.getItem('intern_tasks')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

// ── Component ──────────────────────────────────────
const InternDashboard = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')
  const [liveTime, setLiveTime] = useState(new Date())
  const [tasks, setTasks] = useState<TaskItem[]>(loadTasks)

  // ── Live clock ──
  useEffect(() => {
    const id = setInterval(() => setLiveTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  // ── Reload tasks on focus ──
  useEffect(() => {
    const handler = () => setTasks(loadTasks())
    window.addEventListener('focus', handler)
    window.addEventListener('storage', (e) => {
      if (e.key === 'intern_tasks') setTasks(loadTasks())
    })
    return () => window.removeEventListener('focus', handler)
  }, [])

  // ── Fetch profile ──
  useEffect(() => {
    const load = async () => {
      try {
        const res = await getMeApi()
        setUserName(capitalizeName(res.data.username || 'Intern'))
      } catch {
        setUserName('Intern')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // ── Derived data ──
  const greeting = getGreeting()

  // ── Task stats ──
  const taskStats = useMemo(() => {
    const total = tasks.length
    const completed = tasks.filter((t) => t.status === 'completed').length
    const inProgress = tasks.filter((t) => t.status === 'in-progress' || t.status === 'paused').length
    const notStarted = tasks.filter((t) => t.status === 'not-started').length
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0
    return { total, completed, inProgress, notStarted, completionRate }
  }, [tasks])

  // ── Live formatted time ──
  const formattedLiveTime = liveTime.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })
  const formattedDate = liveTime.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  // ── Render ──
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 font-jakarta">
        <div className="loader" />
        <p className="text-sm text-slate mt-4 animate-pulse">Loading dashboard…</p>
      </div>
    )
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 lg:px-8 py-6 font-jakarta text-navy animate-fadeUp">

      {/* ═══ Hero Greeting Banner ═══ */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0d1b2e] via-[#132238] to-[#1d6ede] text-white p-6 lg:p-8 mb-6">
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5" />
        <div className="absolute top-1/2 right-1/4 w-20 h-20 rounded-full bg-white/[0.03]" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {greeting.icon}
              <span className="text-sm font-medium text-white/70">{greeting.text}</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight mb-1">
              Welcome back, {userName}!
            </h1>
            <p className="text-sm text-white/60">{formattedDate}</p>
          </div>

          {/* Live clock */}
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 border border-white/10">
            <FiClock className="text-xl text-white/70" />
            <div>
              <p className="text-2xl font-extrabold font-mono tracking-wider">{formattedLiveTime}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Stats Grid ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
        {/* Total Tasks */}
        <div className="group bg-white border border-line rounded-xl p-4 hover:shadow-md hover:border-blue/20 transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-lg bg-sky flex items-center justify-center">
              <FiTarget className="text-blue text-base" />
            </div>
          </div>
          <p className="text-xl lg:text-2xl font-extrabold">
            {taskStats.total}
          </p>
          <p className="text-[11px] text-slate mt-0.5">Total Tasks</p>
        </div>

        {/* In Progress */}
        <div className="group bg-white border border-line rounded-xl p-4 hover:shadow-md hover:border-blue/20 transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
              <FiZap className="text-amber-600 text-base" />
            </div>
            {taskStats.inProgress > 0 && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
          </div>
          <p className="text-xl lg:text-2xl font-extrabold">
            {taskStats.inProgress}
          </p>
          <p className="text-[11px] text-slate mt-0.5">In Progress</p>
        </div>

        {/* Completed */}
        <div className="group bg-white border border-line rounded-xl p-4 hover:shadow-md hover:border-blue/20 transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center">
              <FiCheckCircle className="text-green-600 text-base" />
            </div>
          </div>
          <p className="text-xl lg:text-2xl font-extrabold">
            {taskStats.completed}
          </p>
          <p className="text-[11px] text-slate mt-0.5">Completed</p>
        </div>

        {/* Completion Rate */}
        <div className="group bg-white border border-line rounded-xl p-4 hover:shadow-md hover:border-blue/20 transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center">
              <FiClock className="text-purple-600 text-base" />
            </div>
            {taskStats.completionRate === 100 && <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-0.5"><FiAward className="text-xs" /> Done</span>}
          </div>
          <p className="text-xl lg:text-2xl font-extrabold">
            {taskStats.completionRate}<span className="text-sm font-bold text-mist ml-0.5">%</span>
          </p>
          <p className="text-[11px] text-slate mt-0.5">Completion Rate</p>
        </div>
      </div>

      {/* ═══ Main Content Grid ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5 mb-6">

        {/* ── Task Summary Card ── */}
        <div className="bg-white border border-line rounded-[13px] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-extrabold text-navy">Task Overview</h2>
            <button
              onClick={() => navigate('/intern/tasks')}
              className="text-[11px] font-semibold text-blue hover:text-bluelt flex items-center gap-1 transition-colors"
            >
              View All <FiArrowRight className="text-xs" />
            </button>
          </div>

          {/* Completion ring */}
          <div className="flex items-center gap-5 mb-5">
            <div className="relative w-20 h-20 flex-shrink-0">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke="#f0f2f5" strokeWidth="7" />
                <circle
                  cx="40" cy="40" r="34" fill="none"
                  stroke="#1d6ede"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 34}`}
                  strokeDashoffset={`${2 * Math.PI * 34 * (1 - taskStats.completionRate / 100)}`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-extrabold text-navy">{taskStats.completionRate}%</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs text-mist">Completion Rate</p>
              <p className="text-sm font-bold text-navy">{taskStats.completed} of {taskStats.total} tasks done</p>
            </div>
          </div>

          {/* Status breakdown */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue" />
                <span className="text-xs text-slate">In Progress</span>
              </div>
              <span className="text-xs font-bold text-navy">{taskStats.inProgress}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-400" />
                <span className="text-xs text-slate">Not Started</span>
              </div>
              <span className="text-xs font-bold text-navy">{taskStats.notStarted}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-xs text-slate">Completed</span>
              </div>
              <span className="text-xs font-bold text-navy">{taskStats.completed}</span>
            </div>
          </div>
        </div>

        {/* ── Quick Actions ── */}
        <div className="bg-white border border-line rounded-[13px] p-5">
          <h2 className="text-sm font-extrabold text-navy mb-4">Quick Actions</h2>
          <div className="space-y-2.5">
            <button
              onClick={() => navigate('/intern/tasks')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-sky/40 hover:bg-sky text-left transition-colors group"
            >
              <div className="w-9 h-9 rounded-lg bg-blue/10 flex items-center justify-center">
                <FaTasks className="text-blue text-sm" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-navy">Manage Tasks</p>
                <p className="text-[10px] text-mist">Create & track tasks</p>
              </div>
              <FiArrowRight className="text-mist group-hover:text-blue transition-colors" />
            </button>

            <button
              onClick={() => navigate('/intern/messages')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-green-50/60 hover:bg-green-50 text-left transition-colors group"
            >
              <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center">
                <FiMessageSquare className="text-green-600 text-sm" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-navy">Messages</p>
                <p className="text-[10px] text-mist">Chat with batch mates</p>
              </div>
              <FiArrowRight className="text-mist group-hover:text-green-600 transition-colors" />
            </button>

            <button
              onClick={() => navigate('/intern/calendar')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50/60 hover:bg-amber-50 text-left transition-colors group"
            >
              <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
                <FiCalendar className="text-amber-600 text-sm" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-navy">Calendar</p>
                <p className="text-[10px] text-mist">View task calendar</p>
              </div>
              <FiArrowRight className="text-mist group-hover:text-amber-600 transition-colors" />
            </button>
          </div>
        </div>
      </div>

      {/* ═══ Recent Tasks ═══ */}
      {tasks.length > 0 && (
        <div className="bg-white border border-line rounded-[13px] overflow-hidden">
          <div className="px-5 py-4 border-b border-line flex items-center justify-between">
            <span className="text-sm font-extrabold text-navy">Recent Tasks</span>
            <button
              onClick={() => navigate('/intern/tasks')}
              className="text-[11px] font-semibold text-blue hover:text-bluelt flex items-center gap-1 transition-colors"
            >
              View All <FiArrowRight className="text-xs" />
            </button>
          </div>

          <div className="divide-y divide-line">
            {tasks.slice(0, 4).map((task) => {
              const statusMap = {
                'not-started': { label: 'Not Started', color: 'text-mist', bg: 'bg-gray-100', dot: 'bg-gray-400' },
                'in-progress': { label: 'In Progress', color: 'text-blue', bg: 'bg-sky', dot: 'bg-blue' },
                paused: { label: 'Paused', color: 'text-amber-600', bg: 'bg-amber-50', dot: 'bg-amber-500' },
                completed: { label: 'Completed', color: 'text-green-600', bg: 'bg-green-50', dot: 'bg-green-500' },
              }
              const cfg = statusMap[task.status]
              return (
                <div key={task.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-lightbg/50 transition-colors">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                  <span className="text-sm font-semibold text-navy truncate flex-1">{task.title}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                    {cfg.label}
                  </span>
                  {task.status === 'completed' && <FiCheckCircle className="text-green-500 text-sm flex-shrink-0" />}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default InternDashboard