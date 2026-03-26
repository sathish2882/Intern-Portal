import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../redux/hooks'
import { startTest } from '../../redux/slices/testSlice'
import { TEST_CONFIG } from '../../utils/testData'
import { TestType } from '../../types'


const user = {
  name: "Sathish",
  email: "sathish19222978sk@gmail.com"
}

const ASSESSMENTS: { id: TestType; name: string; meta: string; icon: string; active: boolean }[] = [
  {
    id: 'aptitude',
    name: TEST_CONFIG.aptitude.data.title,
    meta: `${TEST_CONFIG.aptitude.data.total} Qs · 45 min · Above Medium`,
    icon: '📐',
    active: true,
  },
  {
    id: 'technical',
    name: TEST_CONFIG.technical.data.title,
    meta: `${TEST_CONFIG.technical.data.total} Qs · 30 min · Medium`,
    icon: '💻',
    active: true,
  },
]

const UserDashboard = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const { result, resultsByType } = useAppSelector((s) => s.test)

  const firstName = user?.name?.split(' ')[0] ?? 'Intern'
  const completed = Object.keys(resultsByType).length
  const bestPct = Object.values(resultsByType).reduce((best, item) => {
    if (!item) return best
    return Math.max(best, Math.round((item.correct / item.total) * 100))
  }, 0)

  const handleStart = (testType: TestType) => {
    dispatch(startTest(testType))
    navigate('/user/test')
  }

  const KPIS = [
    { icon: '📋', label: 'Tests Assigned', value: String(ASSESSMENTS.length), badgeClass: 'bg-sky text-blue', badge: 'Assigned' },
    { icon: '✅', label: 'Completed', value: String(completed), badgeClass: 'bg-[#ecfdf5] text-asuccess', badge: 'Done' },
    { icon: '⏳', label: 'Pending', value: String(ASSESSMENTS.length - completed), badgeClass: 'bg-[#fff7ed] text-[#e07b00]', badge: 'Pending' },
    { icon: '🏆', label: 'Best Score', value: bestPct ? `${bestPct}%` : '—', badgeClass: 'bg-sky text-blue', badge: 'Best' },
  ]

  return (
    <div className="max-w-[1160px] mx-auto px-4 lg:px-8 py-8 font-jakarta text-navy animate-fadeUp">

      {/* Breadcrumb */}
      <p className="text-xs text-mist font-mono mb-6">
        Aptitude Portal › <span className="text-blue">Dashboard</span>
      </p>

      {/* Greeting */}
      <div className="mb-7">
        <h1 className="text-2xl font-extrabold text-navy tracking-tight mb-1">
          Good day, {firstName} 👋
        </h1>
        <p className="text-sm text-slate">You have active assessments waiting. Start when you're ready.</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
        {KPIS.map((k, i) => (
          <div
            key={k.label}
            className="bg-white border border-line rounded-xl p-4 lg:p-5 transition-all hover:shadow-[0_6px_20px_rgba(0,0,0,0.07)] hover:-translate-y-0.5 cursor-default"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <div className="flex items-center justify-between mb-2.5">
              <div className="w-9 h-9 bg-sky rounded-[9px] flex items-center justify-center text-lg">{k.icon}</div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${k.badgeClass}`}>{k.badge}</span>
            </div>
            <p className="text-3xl font-extrabold text-navy tracking-tight">{k.value}</p>
            <p className="text-xs text-slate mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Assessments */}
        <div className="xl:col-span-2 bg-white border border-line rounded-[13px] overflow-hidden">
          <div className="px-5 py-4 border-b border-line">
            <span className="text-sm font-extrabold text-navy">Your Assessments</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line">
                  {['Assessment', 'Status', 'Progress', 'Score', ''].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-[0.5px] text-mist">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ASSESSMENTS.map((a) => {
                  const testResult = resultsByType[a.id]
                  const isDone = Boolean(testResult)
                  const isPassed = testResult?.passed ?? false

                  return (
                    <tr key={a.id} className="border-b border-line last:border-b-0">
                      <td className="px-5 py-3.5 align-middle">
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">{a.icon}</span>
                          <div>
                            <p className="text-[13px] font-bold text-navy">{a.name}</p>
                            <p className="text-[11px] text-mist">{a.meta}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 align-middle">
                        {!a.active ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-lightbg text-mist">
                            Soon
                          </span>
                        ) : isDone ? (
                          <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full
                            ${isPassed ? 'bg-[#ecfdf5] text-asuccess' : 'bg-red-50 text-danger'}`}>
                            {isPassed ? '✓ Pass' : '✕ Fail'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#ecfdf5] text-asuccess">
                            ● New
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 align-middle">
                        <div className="w-[72px] h-1 bg-line rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-700 ${isDone ? 'bg-asuccess w-full' : 'bg-blue w-0'}`} />
                        </div>
                      </td>
                      <td className="px-5 py-3.5 align-middle">
                        <span className={`text-[13px] font-bold ${isDone && isPassed ? 'text-asuccess' : isDone ? 'text-danger' : 'text-mist'}`}>
                          {isDone && testResult ? `${testResult.correct}/${testResult.total}` : '—'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 align-middle">
                        {!a.active ? null : isDone ? (
                          <button
                            disabled
                            className="border border-line rounded-lg px-3 py-1.5 text-xs font-bold text-mist cursor-not-allowed bg-lightbg"
                          >
                            Attempted
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStart(a.id)}
                            className="border border-line rounded-lg px-3 py-1.5 text-xs font-bold text-blue hover:bg-sky hover:border-blue transition-all"
                          >
                            Start →
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white border border-line rounded-[13px] overflow-hidden">
          <div className="px-5 py-4 border-b border-line">
            <span className="text-sm font-extrabold text-navy">Recent Activity</span>
          </div>
          <div className="p-5">
            {result ? (
              <div className="flex gap-3">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${result.passed ? 'bg-asuccess' : 'bg-[#e07b00]'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-navy">
                    {TEST_CONFIG[result.testType].data.title} {result.passed ? 'Passed ✅' : 'Failed ❌'}
                  </p>
                  <p className="text-[11px] text-mist mt-0.5">
                    Score: {result.correct}/{result.total} ({Math.round((result.correct / result.total) * 100)}%)
                  </p>
                </div>
                <span className={`text-[13px] font-extrabold flex-shrink-0 ${result.passed ? 'text-asuccess' : 'text-danger'}`}>
                  {result.passed ? 'PASS' : 'FAIL'}
                </span>
              </div>
            ) : (
              <p className="text-center text-sm text-mist py-6">
                No activity yet. Start a test!
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

export default UserDashboard
