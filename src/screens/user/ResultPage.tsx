import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../redux/hooks'
import { startTest } from '../../redux/slices/testSlice'
import { TEST_CONFIG } from '../../utils/testData'

const ResultPage = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const { activeTestType, result, answers } = useAppSelector((s) => s.test)

  // 🔥 FIX: safe navigation (no crash)
  useEffect(() => {
    if (!result) {
      navigate('/user/dashboard')
    }
  }, [result, navigate])

  if (!result) return null

  const config = TEST_CONFIG[result.testType ?? activeTestType]
  const testData = config.data
  const sectionBreakdown = config.sectionBreakdown

  const pct = Math.round((result.correct / result.total) * 100)
  const passed = result.passed

  // 🔥 Section-wise breakdown (safe)
  const sectionScores = sectionBreakdown.map((sec, si) => {
    const start = sectionBreakdown
      .slice(0, si)
      .reduce((a, b) => a + b.total, 0)

    const slice = answers.slice(start, start + sec.total)

    const correct = slice.filter(
      (a, i) => a === testData.questions[start + i].ans
    ).length

    return { name: sec.name, correct, total: sec.total }
  })

  const handleRetake = () => {
    dispatch(startTest(result.testType))
    navigate('/user/test')
  }

  const handleDashboard = () => navigate('/user/dashboard')

  // 🔥 Show tab violation alert
  useEffect(() => {
    const pendingAlert = sessionStorage.getItem('test_alert_message')

    if (pendingAlert) {
      alert(pendingAlert)
      sessionStorage.removeItem('test_alert_message')
    }
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-lightbg font-jakarta text-navy">

      {/* Result body */}
      <div className="flex-1 flex items-start lg:items-center justify-center px-4 py-8">
        <div className="bg-white border border-line rounded-[20px] w-full max-w-[720px] overflow-hidden animate-fadeUp">

          {/* Banner */}
          <div className={`p-8 lg:p-10 text-center ${
            passed
              ? 'bg-gradient-to-br from-[#ecfdf5] to-[#d1fae5]'
              : 'bg-gradient-to-br from-[#fef2f2] to-[#fee2e2]'
          }`}>
            <div className="text-5xl mb-4">{passed ? '🎉' : '😔'}</div>

            <h1 className={`text-2xl lg:text-[32px] font-extrabold tracking-tight mb-1.5 ${
              passed ? 'text-[#065f46]' : 'text-[#991b1b]'
            }`}>
              {passed
                ? 'CONGRATULATIONS! YOU PASSED'
                : "You're not eligible for the sponsorship benefit"}
            </h1>

            <p className={`text-[15px] mb-6 ${
              passed ? 'text-[#047857]' : 'text-[#b91c1c]'
            }`}>
              {passed
                ? `Great job! You scored ${pct}% and qualified for the next round.`
                : `You scored ${pct}%. You need ${testData.pass}/${testData.total} (60%) to pass.`}
            </p>

            <div className="inline-flex items-baseline gap-1 bg-white rounded-xl px-7 py-4 shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
              <span className={`text-5xl font-extrabold tracking-tight ${
                passed ? 'text-[#065f46]' : 'text-[#991b1b]'
              }`}>
                {result.correct}
              </span>
              <span className="text-2xl text-mist font-semibold">
                /{result.total}
              </span>
            </div>
          </div>

          {/* Details */}
          <div className="p-6 lg:p-8">

            {/* Threshold */}
            <div className="bg-sky border border-[#ccdff8] rounded-[9px] px-4 py-2.5 text-[13px] text-blue font-semibold text-center mb-5">
              Pass mark: 60% ({testData.pass} out of {testData.total} correct)
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { val: result.correct, lbl: '✅ Correct' },
                { val: result.wrong, lbl: '❌ Wrong' },
                { val: result.skipped, lbl: '⏭ Skipped' },
              ].map((s) => (
                <div key={s.lbl} className="bg-lightbg border border-line rounded-[11px] p-4 text-center">
                  <p className="text-[22px] font-extrabold text-navy">{s.val}</p>
                  <p className="text-xs text-slate mt-0.5">{s.lbl}</p>
                </div>
              ))}
            </div>

            {/* Score / Time / Status */}
            <div className="bg-lightbg border border-line rounded-[11px] p-4 mb-6">
              <div className="flex justify-around">
                {[
                  { val: `${pct}%`, lbl: 'Score %', cls: passed ? 'text-asuccess' : 'text-danger' },
                  { val: result.timeTaken, lbl: 'Time Taken', cls: 'text-navy' },
                  { val: passed ? 'PASS' : 'FAIL', lbl: 'Status', cls: passed ? 'text-asuccess' : 'text-danger' },
                ].map((s) => (
                  <div key={s.lbl} className="text-center">
                    <p className={`text-[22px] font-extrabold ${s.cls}`}>{s.val}</p>
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
                  const sp = Math.round((s.correct / s.total) * 100)
                  const col = sp >= 60 ? 'bg-asuccess' : sp >= 40 ? 'bg-[#e07b00]' : 'bg-danger'
                  const txt = sp >= 60 ? 'text-asuccess' : sp >= 40 ? 'text-[#e07b00]' : 'text-danger'

                  return (
                    <div key={s.name} className="flex items-center gap-3">
                      <span className="text-[13px] text-slate w-32 truncate">{s.name}</span>

                      <div className="flex-1 h-2 bg-line rounded-full overflow-hidden">
                        <div className={`h-full ${col}`} style={{ width: `${sp}%` }} />
                      </div>

                      <span className={`text-[13px] font-bold w-12 text-right ${txt}`}>
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
                className="flex-1 bg-white border border-line text-slate py-3 rounded text-sm"
              >
                ↻ Retake Test
              </button>

              <button
                onClick={handleDashboard}
                className="flex-1 bg-blue text-white py-3 rounded text-sm"
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