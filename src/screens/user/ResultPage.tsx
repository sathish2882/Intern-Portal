import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../redux/hooks'
import { startTest } from '../../redux/slices/testSlice'
import { APTITUDE_TEST, SECTION_BREAKDOWN } from '../../utils/testData'

const ResultPage = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { result, answers } = useAppSelector((s) => s.test)
  const { user }            = useAppSelector((s) => s.auth)

  if (!result) { navigate('/user/dashboard'); return null }

  const pct       = Math.round((result.correct / result.total) * 100)
  const passed    = result.passed
  const initials  = user?.name?.charAt(0).toUpperCase() ?? 'U'
  const firstName = user?.name?.split(' ')[0] ?? 'User'

  // Section-wise breakdown
  const sectionScores = SECTION_BREAKDOWN.map((sec, si) => {
    const start = SECTION_BREAKDOWN.slice(0, si).reduce((a, b) => a + b.total, 0)
    const slice = answers.slice(start, start + sec.total)
    const correct = slice.filter((a, i) => a === APTITUDE_TEST.questions[start + i].ans).length
    return { name: sec.name, correct, total: sec.total }
  })

  const handleRetake    = () => { dispatch(startTest()); navigate('/user/test') }
  const handleDashboard = () => navigate('/user/dashboard')

  return (
    <div className="min-h-screen flex flex-col bg-lightbg font-jakarta text-navy">

      {/* Topbar */}
      <nav className="bg-white border-b border-line flex items-center justify-between px-4 lg:px-8 h-[60px]">
        <div className="flex items-center gap-2.5">
          <div className="w-[34px] h-[34px] bg-blue rounded-lg flex items-center justify-center text-base">🎯</div>
          <span className="text-[17px] font-extrabold text-navy">Aptitude Portal</span>
        </div>
        <div className="flex items-center gap-2 py-[5px] pl-[5px] pr-3 border border-line rounded-[9px]">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue to-[#6b49e8] flex items-center justify-center text-[13px] font-extrabold text-white">
            {initials}
          </div>
          <span className="text-[13px] font-bold text-navy hidden sm:block">{firstName}</span>
        </div>
      </nav>

      {/* Result body */}
      <div className="flex-1 flex items-start lg:items-center justify-center px-4 py-8">
        <div className="bg-white border border-line rounded-[20px] w-full max-w-[720px] overflow-hidden animate-fadeUp">

          {/* Banner */}
          <div className={`p-8 lg:p-10 text-center ${passed
            ? 'bg-gradient-to-br from-[#ecfdf5] to-[#d1fae5]'
            : 'bg-gradient-to-br from-[#fef2f2] to-[#fee2e2]'}`}
          >
            <div className="text-5xl mb-4">{passed ? '🎉' : '😔'}</div>
            <h1 className={`text-2xl lg:text-[32px] font-extrabold tracking-tight mb-1.5 ${passed ? 'text-[#065f46]' : 'text-[#991b1b]'}`}>
              {passed ? 'CONGRATULATIONS! YOU PASSED' : 'UNFORTUNATELY, YOU FAILED'}
            </h1>
            <p className={`text-[15px] mb-6 ${passed ? 'text-[#047857]' : 'text-[#b91c1c]'}`}>
              {passed
                ? `Great job! You scored ${pct}% and qualified for the next round.`
                : `You scored ${pct}%. You need ${APTITUDE_TEST.pass}/${APTITUDE_TEST.total} (60%) to pass.`}
            </p>
            <div className="inline-flex items-baseline gap-1 bg-white rounded-xl px-7 py-4 shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
              <span className={`text-5xl font-extrabold tracking-tight ${passed ? 'text-[#065f46]' : 'text-[#991b1b]'}`}>
                {result.correct}
              </span>
              <span className="text-2xl text-mist font-semibold">/{result.total}</span>
            </div>
          </div>

          {/* Details */}
          <div className="p-6 lg:p-8">

            {/* Threshold */}
            <div className="bg-sky border border-[#ccdff8] rounded-[9px] px-4 py-2.5 text-[13px] text-blue font-semibold text-center mb-5">
              Pass mark: 60% ({APTITUDE_TEST.pass} out of {APTITUDE_TEST.total} correct)
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { val: result.correct, lbl: '✅ Correct' },
                { val: result.wrong,   lbl: '❌ Wrong'   },
                { val: result.skipped, lbl: '⏭ Skipped' },
              ].map((s) => (
                <div key={s.lbl} className="bg-lightbg border border-line rounded-[11px] p-4 text-center">
                  <p className="text-[22px] font-extrabold text-navy tracking-tight">{s.val}</p>
                  <p className="text-xs text-slate mt-0.5">{s.lbl}</p>
                </div>
              ))}
            </div>

            {/* Score / Time / Status */}
            <div className="bg-lightbg border border-line rounded-[11px] p-4 mb-6">
              <div className="flex justify-around">
                {[
                  { val: `${pct}%`,         lbl: 'Score %',    cls: passed ? 'text-asuccess' : 'text-danger' },
                  { val: result.timeTaken,  lbl: 'Time Taken', cls: 'text-navy'    },
                  { val: passed ? 'PASS' : 'FAIL', lbl: 'Status', cls: passed ? 'text-asuccess' : 'text-danger' },
                ].map((s) => (
                  <div key={s.lbl} className="text-center">
                    <p className={`text-[22px] font-extrabold tracking-tight ${s.cls}`}>{s.val}</p>
                    <p className="text-xs text-slate mt-0.5">{s.lbl}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Section breakdown */}
            <div className="mb-7">
              <p className="text-sm font-extrabold text-navy mb-3">Section-wise Performance</p>
              <div className="space-y-3">
                {sectionScores.map((s) => {
                  const sp  = Math.round((s.correct / s.total) * 100)
                  const col = sp >= 60 ? 'bg-asuccess' : sp >= 40 ? 'bg-[#e07b00]' : 'bg-danger'
                  const txt = sp >= 60 ? 'text-asuccess' : sp >= 40 ? 'text-[#e07b00]' : 'text-danger'
                  return (
                    <div key={s.name} className="flex items-center gap-3">
                      <span className="text-[13px] text-slate w-32 flex-shrink-0 truncate">{s.name}</span>
                      <div className="flex-1 h-2 bg-line rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-700 ${col}`} style={{ width: `${sp}%` }} />
                      </div>
                      <span className={`text-[13px] font-bold w-12 text-right flex-shrink-0 ${txt}`}>
                        {s.correct}/{s.total}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleRetake}
                className="flex-1 bg-white border-[1.5px] border-line hover:border-blue hover:text-blue text-slate font-bold py-3 rounded-[9px] text-sm transition-all"
              >
                ↺ Retake Test
              </button>
              <button
                onClick={handleDashboard}
                className="flex-1 bg-blue hover:bg-bluelt text-white font-bold py-3 rounded-[9px] text-sm transition-all shadow-[0_4px_12px_rgba(29,110,222,0.25)] hover:-translate-y-px"
              >
                → Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResultPage
