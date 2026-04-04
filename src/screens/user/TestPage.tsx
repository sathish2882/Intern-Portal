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
} from "../../redux/slices/testSlice";
import { TEST_CONFIG } from "../../utils/testData";
import { TestResult } from "../../types";
import { getTestStatusApi, submitResultApi } from "../../services/testApi";

function TestPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const violationsRef = useRef(0);
  const isSubmittingRef = useRef(false);
  const fullscreenExitingRef = useRef(false);
  const lastViolationTimeRef = useRef(0);
  const [submitting, setSubmitting] = useState(false);

  // Popup state
  const [warningMsg, setWarningMsg] = useState<string | null>(null);
  const [showGuidelines, setShowGuidelines] = useState(true);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [showFullscreenRestore, setShowFullscreenRestore] = useState(false);
  const warningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blurStartRef = useRef<number | null>(null);

  const showWarning = useCallback((msg: string, duration = 3000) => {
    setWarningMsg(msg);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    warningTimeoutRef.current = setTimeout(() => setWarningMsg(null), duration);
  }, []);

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
      const q = questions[i];

      if (ans === null) {
        skipped++;
      } else if ("ans" in q) {
        if (ans === q.ans) correct++;
        else wrong++;
      }
      // ✅ coding questions ignored
    });
    return { correct, wrong, skipped };
  };

  // ✅ MAIN SUBMIT FUNCTION
  const handleSubmit = useCallback(async () => {
    if (isSubmittingRef.current || !testStarted) return;

    isSubmittingRef.current = true;
    setSubmitting(true);

    // Exit fullscreen before navigating to prevent cleanup conflicts
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => {});
    }

    try {
      const { correct, wrong, skipped } = calculateResult();

      const elapsed = durationSeconds - timeLeft;

      // Pass mark is 25 correct answers for both tests
      const passMark = 25;
      const result: TestResult = {
        testType: activeTestType,
        correct,
        wrong,
        skipped,
        total: questions.length,
        passed: correct >= passMark,
        timeTaken: "",
      };

      // send to backend
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

      // update redux FIRST (IMPORTANT FIX)
      dispatch(submitTest(result));

      // fetch latest status
      const statusRes = await getTestStatusApi();
      const status = statusRes?.data?.status;

      console.log(
        "📊 After submit - Status:",
        status,
        "Response:",
        statusRes?.data,
      );

      // navigate
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
        }),
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

  // ✅ GLOBAL VIOLATION COOLDOWN (prevents duplicate rapid events)
  const registerViolation = useCallback(
    (msg?: string) => {
      const now = Date.now();

      // Ignore rapid duplicate events (within 2s)
      if (now - lastViolationTimeRef.current < 2000) return;

      lastViolationTimeRef.current = now;
      violationsRef.current += 1;

      if (violationsRef.current === 1) {
        showWarning(msg || "⚠️ Warning: Do not perform this action again!");
        return;
      }

      if (violationsRef.current >= 2) {
        handleSubmit();
      }
    },
    [handleSubmit, showWarning],
  );

  // ✅ FULLSCREEN ON TEST PAGE (handled by guidelines accept now)
  useEffect(() => {
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

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
    if (timeLeft <= 0 && testStarted) {
      showWarning("⏱ Time is up! Submitting your test.", 5000);
      handleSubmit();
    }
  }, [timeLeft, testStarted, handleSubmit, showWarning]);

  // ✅ TAB SWITCH DETECTION
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (
        !testStarted ||
        isSubmittingRef.current ||
        fullscreenExitingRef.current ||
        showFullscreenRestore
      )
        return;

      if (document.hidden) {
        blurStartRef.current = Date.now();
      } else {
        if (!blurStartRef.current) return;

        const duration = Date.now() - blurStartRef.current;

        if (duration > 1200) {
          registerViolation();
        }

        blurStartRef.current = null;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [handleSubmit, testStarted, registerViolation, showFullscreenRestore]);

  // ✅ PREVENT ESC & FORCE FULLSCREEN (1st ESC = warning, 2nd ESC = submit)
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!testStarted || isSubmittingRef.current) return;

      // If exited fullscreen
      if (!document.fullscreenElement) {
        const now = Date.now();

        // Ignore rapid duplicate fullscreen exits (within 3s cooldown)
        if (now - lastViolationTimeRef.current < 3000) return;

        fullscreenExitingRef.current = true;

        // Delay to block blur/visibility events
        setTimeout(() => {
          fullscreenExitingRef.current = false;
        }, 2000);

        // Use single violation system
        registerViolation(
          "⚠️ Do not exit fullscreen! Next time your test will be auto-submitted.",
        );

        // Show restore overlay if not auto-submitting
        if (violationsRef.current < 2) {
          setWarningMsg(null); // ❌ remove warning popup
          setShowFullscreenRestore(true); // ✅ show only fullscreen popup
        }
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [testStarted, handleSubmit, showWarning, registerViolation]);

  // ✅ DISABLE RIGHT CLICK
  useEffect(() => {
    const disableRightClick = (e: MouseEvent) => e.preventDefault();

    document.addEventListener("contextmenu", disableRightClick);

    return () => {
      document.removeEventListener("contextmenu", disableRightClick);
    };
  }, []);

  // ✅ DISABLE COPY / PASTE / SELECT
  useEffect(() => {
    const preventCopy = (e: ClipboardEvent) => e.preventDefault();
    const preventSelect = (e: Event) => e.preventDefault();

    document.addEventListener("copy", preventCopy);
    document.addEventListener("cut", preventCopy);
    document.addEventListener("paste", preventCopy);
    document.addEventListener("selectstart", preventSelect);

    return () => {
      document.removeEventListener("copy", preventCopy);
      document.removeEventListener("cut", preventCopy);
      document.removeEventListener("paste", preventCopy);
      document.removeEventListener("selectstart", preventSelect);
    };
  }, []);

  // ✅ DISABLE DEVTOOLS
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(e.key)) ||
        (e.ctrlKey && e.key === "U")
      ) {
        e.preventDefault();
        registerViolation();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleSubmit, registerViolation]);

  // ✅ DETECT APP SWITCHING (WINDOW BLUR)
  useEffect(() => {
    const handleBlur = () => {
      if (
        !testStarted ||
        isSubmittingRef.current ||
        fullscreenExitingRef.current ||
        showFullscreenRestore
      )
        return;

      blurStartRef.current = Date.now();
    };

    const handleFocus = () => {
      if (!blurStartRef.current) return;

      const duration = Date.now() - blurStartRef.current;

      // 👉 Ignore short blur (notification)
      if (duration < 1200) {
        blurStartRef.current = null;
        return;
      }

      // 👉 Real tab switch / app switch
      registerViolation();

      blurStartRef.current = null;
    };

    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
    };
  }, [testStarted, handleSubmit, registerViolation, showFullscreenRestore]);

  // ✅ PREVENT PAGE RELOAD / BACK
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Are you sure you want to leave?";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // ✅ CONFIRM SUBMIT
  const confirmSubmit = () => {
    if (isSubmittingRef.current) return;

    const unanswered = answers.filter((a) => a === null).length;

    if (unanswered > 0) {
      setShowConfirmSubmit(true);
      return;
    }

    handleSubmit();
  };

  // ✅ HANDLE GUIDELINES ACCEPT
  const handleAcceptGuidelines = async () => {
    setShowGuidelines(false);
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch (err) {
      console.log("Fullscreen request failed:", err);
    }
  };

  // ✅ TIME FORMAT
  const fmt = (sec: number) =>
    `${Math.floor(sec / 60)
      .toString()
      .padStart(2, "0")}:${(sec % 60).toString().padStart(2, "0")}`;

  const answered = answers.filter((a) => a !== null).length;
  const isLow = timeLeft < 300;
  const q = questions[currentQuestion];
  const isLast = currentQuestion === questions.length - 1;

  if (submitting) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-lightbg font-jakarta text-navy gap-5">
        <div className="loader" />
        <p className="text-sm font-semibold text-slate animate-pulse">
          Submitting your test…
        </p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-lightbg font-jakarta text-navy">
      {/* ✅ TEST GUIDELINES POPUP */}
      {showGuidelines && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-[92%] p-7 animate-[fadeIn_0.2s_ease-out]">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-sky flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-blue"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-navy">Test Guidelines</h2>
            </div>

            <ul className="space-y-2.5 text-[13px] text-slate mb-6">
              <li className="flex items-start gap-2">
                <span className="text-blue font-bold mt-0.5">01.</span>
                <span>
                  The test will run in{" "}
                  <strong className="text-navy">fullscreen mode</strong>. Do not
                  press ESC or exit fullscreen.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue font-bold mt-0.5">02.</span>
                <span>
                  <strong className="text-navy">Do not switch tabs</strong> or
                  open other applications during the test.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue font-bold mt-0.5">03.</span>
                <span>
                  <strong className="text-navy">
                    Copy, paste, and right-click
                  </strong>{" "}
                  are disabled throughout the test.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue font-bold mt-0.5">04.</span>
                <span>
                  <strong className="text-navy">Developer tools</strong> (F12,
                  Ctrl+Shift+I, etc.) are not allowed.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue font-bold mt-0.5">05.</span>
                <span>
                  You have{" "}
                  <strong className="text-navy">
                    {Math.floor(durationSeconds / 60)} minutes
                  </strong>{" "}
                  to complete{" "}
                  <strong className="text-navy">
                    {questions.length} questions
                  </strong>
                  .
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue font-bold mt-0.5">06.</span>
                <span>
                  Any <strong className="text-navy">2 violations</strong> will
                  result in automatic test submission.
                </span>
              </li>
            </ul>

            <div className="flex items-center gap-3 pt-2 border-t border-line">
              <button
                onClick={() => {
                  navigate("/user/dashboard", { replace: true });
                }}
                className="flex-1 py-2.5 rounded-lg border border-line text-[13px] font-bold text-slate hover:bg-gray-50 transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={handleAcceptGuidelines}
                className="flex-1 py-2.5 rounded-lg bg-blue hover:bg-bluelt text-white text-[13px] font-bold transition-colors shadow-[0_3px_10px_rgba(29,110,222,0.25)]"
              >
                I Understand, Start Test
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ FULLSCREEN RESTORE OVERLAY */}
      {showFullscreenRestore && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-[88%] p-6 animate-[fadeIn_0.2s_ease-out]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-5 h-5 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-navy">
                  Fullscreen Required
                </h3>
                <p className="text-[12px] text-slate mt-0.5">
                  You exited fullscreen mode. This is a violation.
                </p>
              </div>
            </div>
            <p className="text-[13px] text-red-500 font-semibold mb-4">
              Warning: If you exit fullscreen again, your test will be
              automatically submitted.
            </p>
            <button
              onClick={async () => {
                try {
                  await document.documentElement.requestFullscreen();
                } catch (err) {
                  console.log("Fullscreen request failed:", err);
                }
                setShowFullscreenRestore(false);
              }}
              className="w-full py-2.5 rounded-lg bg-blue hover:bg-bluelt text-white text-[13px] font-bold transition-colors shadow-[0_3px_10px_rgba(29,110,222,0.25)]"
            >
              Return to Fullscreen
            </button>
          </div>
        </div>
      )}

      {/* ✅ WARNING POPUP */}
      {warningMsg && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 backdrop-blur-[2px] pointer-events-none">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-[88%] p-5 pointer-events-auto animate-[fadeIn_0.15s_ease-out]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-5 h-5 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <p className="text-[14px] font-semibold text-navy leading-snug">
                {warningMsg}
              </p>
            </div>
            <button
              onClick={() => setWarningMsg(null)}
              className="w-full mt-1 py-2 rounded-lg bg-navy hover:bg-navy3 text-white text-[13px] font-bold transition-colors"
            >
              Understood
            </button>
          </div>
        </div>
      )}

      {/* ✅ CONFIRM SUBMIT POPUP */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-[88%] p-5 animate-[fadeIn_0.15s_ease-out]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-5 h-5 text-amber-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-[14px] font-semibold text-navy leading-snug">
                You have {answers.filter((a) => a === null).length} unanswered
                question(s). Submit anyway?
              </p>
            </div>
            <div className="flex items-center gap-2.5 mt-4">
              <button
                onClick={() => setShowConfirmSubmit(false)}
                className="flex-1 py-2.5 rounded-lg border border-line text-[13px] font-bold text-slate hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowConfirmSubmit(false);
                  handleSubmit();
                }}
                className="flex-1 py-2.5 rounded-lg bg-blue hover:bg-bluelt text-white text-[13px] font-bold transition-colors"
              >
                Yes, Submit
              </button>
            </div>
          </div>
        </div>
      )}
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
              {"section" in q && <p>{q.section}</p>}{" "}
            </div>

            <div className="bg-white border border-line rounded-[13px] p-5 lg:p-7 mb-4">
              <p className="text-[11px] font-bold text-mist uppercase tracking-[0.5px] mb-2.5">
                Question {currentQuestion + 1} of {questions.length}
              </p>
              <p className="text-[15px] font-semibold text-navy leading-relaxed mb-6">
                {"q" in q && q.q}
              </p>

              <div className="flex flex-col gap-2.5">
                {"opts" in q &&
                  q.opts.map((opt, i) => {
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
          </div>
        </main>
      </div>
    </div>
  );
}

export default TestPage;
