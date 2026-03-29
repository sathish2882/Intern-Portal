import { useEffect, useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import {
  selectAnswer,
  goToQuestion,
  nextQuestion,
  prevQuestion,
  tickTimer,
  submitTest,
  resetTest,
} from "../../redux/slices/testSlice";
import { TEST_CONFIG } from "../../utils/testData";
import { TestResult } from "../../types";
import { getTestStatusApi, submitResultApi } from "../../services/testApi";

const TestPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const violationsRef = useRef(0);
  const isSubmittingRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    activeTestType,
    currentQuestion,
    answers,
    testStarted,
    testSubmitted,
    timeLeft,
  } = useAppSelector((s) => s.test);

  const activeTest = TEST_CONFIG[activeTestType].data;
  const durationSeconds = TEST_CONFIG[activeTestType].durationSeconds;
  const questions = activeTest.questions;

  // ✅ RESULT CALCULATION
  const calculateResult = () => {
    let correct = 0;
    let wrong = 0;
    let skipped = 0;

    answers.forEach((ans, i) => {
      if (ans === null) skipped++;
      else if (ans === questions[i].ans) correct++;
      else wrong++;
    });

    return { correct, wrong, skipped };
  };

  // ✅ MAIN SUBMIT FUNCTION
  const handleSubmit = useCallback(async () => {
    if (isSubmittingRef.current || !testStarted) return;

    isSubmittingRef.current = true;
    setSubmitting(true);

    try {
      const { correct, wrong, skipped } = calculateResult();

      const elapsed = durationSeconds - timeLeft;

      const result: TestResult = {
        testType: activeTestType,
        correct,
        wrong,
        skipped,
        total: questions.length,
        passed: correct >= activeTest.pass,
        timeTaken: "",
      };

      // 🔥 send to backend
      const submitPayload = {
        test_type: activeTestType,
        correct_answers: correct,
        wrong_answers: wrong,
        skipped_answers: skipped,
        total_questions: questions.length,
        score: correct,
        time_taken: elapsed,
      };

      console.log("📤 Submitting test payload:", submitPayload);

      await submitResultApi(submitPayload);

      console.log("✅ Test submitted successfully");

      // 🔥 update redux FIRST (IMPORTANT FIX)
      dispatch(submitTest(result));

      // 🔥 fetch latest status
      const statusRes = await getTestStatusApi();
      const status = statusRes?.data?.status;

      console.log("📊 After submit - Status:", status, "Response:", statusRes?.data);

      // 🔥 navigate
      if (status === "completed") {
        navigate("/user/result", { replace: true });
      } else {
        navigate("/user/dashboard", { replace: true });
      }
    } catch (error: any) {
      console.log("❌ Submit error:", error);
      toast.error(error?.response?.data?.detail || "Failed to submit test");

      // fallback
      dispatch(
        submitTest({
          testType: activeTestType,
          correct: 0,
          wrong: 0,
          skipped: 0,
          total: questions.length,
          passed: false,
          timeTaken: "",
        })
      );

      navigate("/user/dashboard", { replace: true });
    } finally {
      setSubmitting(false);
      isSubmittingRef.current = false;
    }
  }, [
    activeTestType,
    answers,
    questions,
    durationSeconds,
    timeLeft,
    testStarted,
    dispatch,
    navigate,
  ]);

  // ✅ FULLSCREEN ON TEST PAGE
  useEffect(() => {
    if (!testStarted) return;

    const enterFullscreen = async () => {
      try {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
        }
      } catch (err) {
        console.log("Fullscreen request failed:", err);
      }
    };

    enterFullscreen();

    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, [testStarted]);

  // ✅ TIMER
  useEffect(() => {
    if (!testStarted && !isSubmittingRef.current && !testSubmitted) {
      navigate("/user/dashboard", { replace: true });
      return;
    }

    if (!testStarted) return;

    const timer = setInterval(() => dispatch(tickTimer()), 1000);
    return () => clearInterval(timer);
  }, [dispatch, navigate, testStarted, testSubmitted]);

  // ✅ AUTO SUBMIT ON TIME END
  useEffect(() => {
    if (timeLeft === 0 && testStarted) {
      alert("Time is up! Submitting your test.");
      handleSubmit();
    }
  }, [timeLeft, testStarted, handleSubmit]);

  // ✅ TAB SWITCH DETECTION
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!testStarted || isSubmittingRef.current) return;

      if (document.hidden) {
        violationsRef.current += 1;

        if (violationsRef.current === 2) {
          sessionStorage.setItem(
            "test_alert_message",
            "You switched tabs multiple times. Test auto-submitted."
          );
          handleSubmit();
        }
      } else {
        if (violationsRef.current === 1) {
          alert("Warning: Do not switch tabs again!");
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [handleSubmit, testStarted]);

  // ✅ CONFIRM SUBMIT
  const confirmSubmit = () => {
    if (isSubmittingRef.current) return;

    const unanswered = answers.filter((a) => a === null).length;

    if (
      unanswered > 0 &&
      !window.confirm(
        `You have ${unanswered} unanswered question(s). Submit anyway?`
      )
    ) {
      return;
    }

    handleSubmit();
  };

  // ✅ TIME FORMAT
  const fmt = (sec: number) =>
    `${Math.floor(sec / 60)
      .toString()
      .padStart(2, "0")}:${(sec % 60)
      .toString()
      .padStart(2, "0")}`;

  const answered = answers.filter((a) => a !== null).length;
  const isLow = timeLeft < 300;
  const q = questions[currentQuestion];
  const isLast = currentQuestion === questions.length - 1;

  if (submitting) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-lightbg font-jakarta text-navy gap-5">
        <div className="loader" />
        <p className="text-sm font-semibold text-slate animate-pulse">Submitting your test…</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-lightbg font-jakarta text-navy">
      <nav className="bg-white border-b border-line flex items-center justify-between px-4 lg:px-8 h-[60px] sticky top-0 z-50">
        <span className="text-[13px] text-slate font-mono hidden md:block">
          {activeTest.title}
        </span>
        <div className="flex items-center gap-2 lg:gap-3">
          <div
            className={`flex items-center gap-2 px-3 py-2 border rounded-[9px] font-mono text-[18px] font-bold
            ${isLow ? "border-danger text-danger animate-blink" : "border-line text-navy"}`}
          >
            <span>Time</span>
            <span>{fmt(timeLeft)}</span>
          </div>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden md:flex w-[260px] bg-white border-r border-line flex-col gap-5 p-5 flex-shrink-0 h-[calc(100vh-60px)] overflow-y-auto">
          <div>
            <p className="text-[13px] font-extrabold text-navy mb-3">
              Question Navigator
            </p>
            <div className="grid grid-cols-5 gap-1.5">
              {questions.map((_, i) => {
                const isAns = answers[i] !== null;
                const isCur = i === currentQuestion;
                return (
                  <button
                    key={i}
                    onClick={() => dispatch(goToQuestion(i))}
                    className={`aspect-square rounded-lg text-xs font-bold transition-all
                      ${
                        isCur
                          ? "bg-sky border-[1.5px] border-blue text-blue"
                          : isAns
                            ? "bg-blue border-[1.5px] border-blue text-white"
                            : "bg-white border-[1.5px] border-line text-slate hover:border-blue hover:text-blue"
                      }`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            {[
              { cls: "bg-blue border-blue", label: "Answered" },
              { cls: "bg-sky border-blue", label: "Current" },
              { cls: "bg-white border-line", label: "Unanswered" },
            ].map((l) => (
              <div
                key={l.label}
                className="flex items-center gap-2 text-xs text-slate"
              >
                <div
                  className={`w-2.5 h-2.5 rounded border-[1.5px] flex-shrink-0 ${l.cls}`}
                />
                {l.label}
              </div>
            ))}
          </div>

          <div className="mt-auto sticky bottom-0 bg-white pt-3">
            <div className="flex justify-between text-xs font-semibold text-slate mb-1.5">
              <span>Progress</span>
              <span>
                {answered}/{questions.length}
              </span>
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

        <main className="flex-1 p-4 lg:p-9 overflow-y-auto max-h-[calc(100vh-60px)]">
          <div className="max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 bg-sky text-blue border border-[#ccdff8] rounded-lg px-3 py-1.5 text-xs font-bold mb-4">
              {q.section}
            </div>

            <div className="bg-white border border-line rounded-[13px] p-5 lg:p-7 mb-4">
              <p className="text-[11px] font-bold text-mist uppercase tracking-[0.5px] mb-2.5">
                Question {currentQuestion + 1} of {questions.length}
              </p>
              <p className="text-[15px] font-semibold text-navy leading-relaxed mb-6">
                {q.q}
              </p>

              <div className="flex flex-col gap-2.5">
                {q.opts.map((opt, i) => {
                  const sel = answers[currentQuestion] === i;
                  return (
                    <button
                      key={i}
                      onClick={() =>
                        dispatch(
                          selectAnswer({
                            questionIndex: currentQuestion,
                            answer: i,
                          }),
                        )
                      }
                      className={`flex items-start gap-3 w-full text-left px-4 py-3.5 border-[1.5px] rounded-[10px] transition-all
                        ${
                          sel
                            ? "border-blue bg-sky"
                            : "border-line bg-white hover:border-blue hover:bg-sky"
                        }`}
                    >
                      <div
                        className={`w-[26px] h-[26px] rounded-lg border-[1.5px] flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all
                        ${sel ? "bg-blue border-blue text-white" : "border-line text-slate"}`}
                      >
                        {["A", "B", "C", "D"][i]}
                      </div>
                      <span className="text-sm text-navy leading-relaxed pt-0.5">
                        {opt}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => dispatch(prevQuestion())}
                disabled={currentQuestion === 0}
                className="px-5 py-2.5 bg-white border border-line rounded-[9px] text-[13px] font-bold text-slate hover:border-blue hover:text-blue disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Previous
              </button>
              <span className="text-[13px] text-mist font-mono">
                {currentQuestion + 1} / {questions.length}
              </span>
              <button
                onClick={
                  isLast ? confirmSubmit : () => dispatch(nextQuestion())
                }
                className="px-5 py-2.5 bg-blue hover:bg-bluelt text-white font-bold text-[13px] rounded-[9px] shadow-[0_3px_10px_rgba(29,110,222,0.25)] hover:shadow-[0_5px_16px_rgba(29,110,222,0.35)] transition-all"
              >
                {isLast ? "Submit Test" : "Next"}
              </button>
            </div>

            <div className="mt-5 md:hidden">
              <button
                onClick={confirmSubmit}
                disabled={submitting}
                className={`w-full py-3 rounded font-bold transition ${
                  submitting
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-navy text-white hover:bg-navy3"
                }`}
              >
                {submitting ? "Submitting..." : "Submit Test"}
              </button>
            </div>

            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  dispatch(resetTest());
                  navigate("/user/dashboard");
                }}
                className="text-xs text-mist hover:text-slate transition-colors underline underline-offset-2"
              >
                Exit without submitting
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TestPage;
