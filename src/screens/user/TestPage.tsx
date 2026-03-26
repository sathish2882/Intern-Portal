import { useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../redux/hooks'
import {
  selectAnswer, goToQuestion, nextQuestion,
  prevQuestion, tickTimer, submitTest, resetTest,
} from '../../redux/slices/testSlice'
import { TEST_CONFIG } from '../../utils/testData'
import { TestResult } from '../../types'
const TestPage = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const violationsRef = useRef(0)

  const { activeTestType, currentQuestion, answers, testStarted, timeLeft } = useAppSelector((s) => s.test)
  const activeTest = TEST_CONFIG[activeTestType].data
  const durationSeconds = TEST_CONFIG[activeTestType].durationSeconds
  const questions = activeTest.questions

  const handleSubmit = useCallback(() => {
    let correct = 0, wrong = 0, skipped = 0
    answers.forEach((ans, i) => {
      if (ans === null) skipped++
      else if (ans === questions[i].ans) correct++
      else wrong++
    })
    const elapsed = durationSeconds - timeLeft
    const m = Math.floor(Math.abs(elapsed) / 60).toString().padStart(2, '0')
    const s = (Math.abs(elapsed) % 60).toString().padStart(2, '0')
    const result: TestResult = {
      testType: activeTestType,
      correct, wrong, skipped,
      total: questions.length,
      passed: correct >= activeTest.pass,
      timeTaken: `${m}:${s}`,
    }
    dispatch(submitTest(result))
    navigate('/user/result')
  }, [activeTest.pass, activeTestType, answers, dispatch, durationSeconds, navigate, questions, timeLeft])

  useEffect(() => {
    if (!testStarted) { navigate('/user/dashboard'); return }
    const t = setInterval(() => dispatch(tickTimer()), 1000)
    return () => clearInterval(t)
  }, [testStarted, dispatch, navigate])

  useEffect(() => {
    if (timeLeft === 0 && testStarted) {
      alert('Time is up! Submitting your test.')
      handleSubmit()
    }
  }, [timeLeft, testStarted, handleSubmit])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!testStarted) return

      if (document.hidden) {
        violationsRef.current += 1

        if (violationsRef.current >= 2) {
          sessionStorage.setItem(
            'test_alert_message',
            'You switched tabs multiple times. Your test was submitted automatically.',
          )
          handleSubmit()
        }
      } else if (violationsRef.current > 0 && violationsRef.current < 2) {
        alert(`Warning ${violationsRef.current}/2: Do not switch tabs!`)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [handleSubmit, testStarted])

  const confirmSubmit = () => {
    const unanswered = answers.filter((a) => a === null).length
    if (unanswered > 0 && !window.confirm(`You have ${unanswered} unanswered question(s). Submit anyway?`)) return
    handleSubmit()
  }

  const fmt = (sec: number) =>
    `${Math.floor(sec / 60).toString().padStart(2, '0')}:${(sec % 60).toString().padStart(2, '0')}`

  const answered = answers.filter((a) => a !== null).length
  const isLow = timeLeft < 300
  const q = questions[currentQuestion]
  const isLast = currentQuestion === questions.length - 1

  return (
    <div className="min-h-screen flex flex-col bg-lightbg font-jakarta text-navy">

      {/* Topbar */}
      <nav className="bg-white border-b border-line flex items-center justify-between px-4 lg:px-8 h-[60px] sticky top-0 z-50">
        
        <span className="text-[13px] text-slate font-mono hidden md:block">{activeTest.title}</span>
        <div className="flex items-center gap-2 lg:gap-3">
          <div className={`flex items-center gap-2 px-3 py-2 border rounded-[9px] font-mono text-[18px] font-bold
            ${isLow ? 'border-danger text-danger animate-blink' : 'border-line text-navy'}`}>
            <span>⏱</span>
            <span>{fmt(timeLeft)}</span>
          </div>
          
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar — hidden on mobile */}
        <aside className="hidden md:flex w-[260px] bg-white border-r border-line flex-col gap-5 p-5 flex-shrink-0 sticky top-[60px] h-[calc(100vh-60px)] overflow-y-auto">
          <div>
            <p className="text-[13px] font-extrabold text-navy mb-3">Question Navigator</p>
            <div className="grid grid-cols-5 gap-1.5">
              {questions.map((_, i) => {
                const isAns = answers[i] !== null
                const isCur = i === currentQuestion
                return (
                  <button
                    key={i}
                    onClick={() => dispatch(goToQuestion(i))}
                    className={`aspect-square rounded-lg text-xs font-bold transition-all
                      ${isCur  ? 'bg-sky border-[1.5px] border-blue text-blue'
                      : isAns  ? 'bg-blue border-[1.5px] border-blue text-white'
                      : 'bg-white border-[1.5px] border-line text-slate hover:border-blue hover:text-blue'}`}
                  >
                    {i + 1}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-col gap-1.5">
            {[
              { cls: 'bg-blue border-blue', label: 'Answered'   },
              { cls: 'bg-sky border-blue',  label: 'Current'    },
              { cls: 'bg-white border-line',label: 'Unanswered' },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-2 text-xs text-slate">
                <div className={`w-2.5 h-2.5 rounded border-[1.5px] flex-shrink-0 ${l.cls}`} />
                {l.label}
              </div>
            ))}
          </div>

          <div className="mt-auto">
            <div className="flex justify-between text-xs font-semibold text-slate mb-1.5">
              <span>Progress</span>
              <span>{answered}/{questions.length}</span>
            </div>
            <div className="h-1.5 bg-line rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-blue rounded-full transition-all duration-300"
                style={{ width: `${(answered / questions.length) * 100}%` }}
              />
            </div>
            <button
              onClick={confirmSubmit}
              className="w-full bg-navy hover:bg-navy3 text-white font-bold text-sm py-3 rounded-[9px] transition-colors"
            >
              Submit Test
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-4 lg:p-9 overflow-y-auto max-h-[calc(100vh-60px)]">
          <div className="max-w-2xl mx-auto">

            {/* Section badge */}
            <div className="inline-flex items-center gap-1.5 bg-sky text-blue border border-[#ccdff8] rounded-lg px-3 py-1.5 text-xs font-bold mb-4">
              {q.section}
            </div>

            {/* Question card */}
            <div className="bg-white border border-line rounded-[13px] p-5 lg:p-7 mb-4">
              <p className="text-[11px] font-bold text-mist uppercase tracking-[0.5px] mb-2.5">
                Question {currentQuestion + 1} of {questions.length}
              </p>
              <p className="text-[15px] font-semibold text-navy leading-relaxed mb-6">{q.q}</p>

              {/* Options */}
              <div className="flex flex-col gap-2.5">
                {q.opts.map((opt, i) => {
                  const sel = answers[currentQuestion] === i
                  return (
                    <button
                      key={i}
                      onClick={() => dispatch(selectAnswer({ questionIndex: currentQuestion, answer: i }))}
                      className={`flex items-start gap-3 w-full text-left px-4 py-3.5 border-[1.5px] rounded-[10px] transition-all
                        ${sel
                          ? 'border-blue bg-sky'
                          : 'border-line bg-white hover:border-blue hover:bg-sky'
                        }`}
                    >
                      <div className={`w-[26px] h-[26px] rounded-lg border-[1.5px] flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all
                        ${sel ? 'bg-blue border-blue text-white' : 'border-line text-slate'}`}>
                        {['A', 'B', 'C', 'D'][i]}
                      </div>
                      <span className="text-sm text-navy leading-relaxed pt-0.5">{opt}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Nav row */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => dispatch(prevQuestion())}
                disabled={currentQuestion === 0}
                className="px-5 py-2.5 bg-white border border-line rounded-[9px] text-[13px] font-bold text-slate hover:border-blue hover:text-blue disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                ← Previous
              </button>
              <span className="text-[13px] text-mist font-mono">
                {currentQuestion + 1} / {questions.length}
              </span>
              <button
                onClick={isLast ? confirmSubmit : () => dispatch(nextQuestion())}
                className="px-5 py-2.5 bg-blue hover:bg-bluelt text-white font-bold text-[13px] rounded-[9px] shadow-[0_3px_10px_rgba(29,110,222,0.25)] hover:shadow-[0_5px_16px_rgba(29,110,222,0.35)] transition-all"
              >
                {isLast ? 'Submit Test ✓' : 'Next →'}
              </button>
            </div>

            {/* Mobile submit */}
            <div className="mt-5 md:hidden">
              <button
                onClick={confirmSubmit}
                className="w-full bg-navy text-white font-bold text-sm py-3 rounded-[9px] transition-colors hover:bg-navy3"
              >
                Submit Test
              </button>
            </div>

            <div className="mt-4 text-center">
              <button
                onClick={() => { dispatch(resetTest()); navigate('/user/dashboard') }}
                className="text-xs text-mist hover:text-slate transition-colors underline underline-offset-2"
              >
                Exit without submitting
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default TestPage
