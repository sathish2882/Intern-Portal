import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { getTestQuestionsApi, runCodeApi, submitCodeApi } from "../../services/testApi";
import {
  FiPlay,
  FiSend,
  FiChevronLeft,
  FiChevronRight,
  FiAlertTriangle,
  FiCheckCircle,
  FiCode,
  FiEyeOff,
  FiMaximize,
  FiShield,
  FiTerminal,
} from "react-icons/fi";

type SupportedLanguage = "javascript" | "python" | "java" | "cpp";
type SubmitMode = "manual" | "violation";

interface ApiCodingTestCase {
  input: string;
  output: string;
  hidden: boolean;
}

interface ApiCodingQuestion {
  question_id: number;
  question_text: string;
  question_section: string;
  test_cases: ApiCodingTestCase[];
}

interface LegacyApiQuestion {
  id: number;
  question: string;
  section: string;
  options: { id: number; label: string; text: string }[];
}

interface CodingQuestionItem {
  question_id: number;
  title: string;
  description: string;
  section: string;
  testCases: ApiCodingTestCase[];
}

const CODING_TEST_DURATION = 3600; // 60 minutes

const CODE_TEMPLATES: Record<SupportedLanguage, string> = {
  javascript: `function solve(input) {
  // Write your logic
  return input;
}`,

  python: `def solve(input):
    # Write your logic
    return input`,

  java: `import java.util.*;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String input = sc.nextLine();
        System.out.println(solve(input));
    }

    public static String solve(String input) {
        // Write your logic
        return input;
    }
}`,

  cpp: `#include <iostream>
using namespace std;

string solve(string input) {
    // Write your logic
    return input;
}

int main() {
    string input;
    getline(cin, input);
    cout << solve(input);
    return 0;
}`,
};



const formatBackendOutput = (data: any) => {
  if (typeof data === "string") return data;

  if (data?.results) {
    return JSON.stringify(data.results, null, 2);
  }

  if (data?.output) {
    return typeof data.output === "string"
      ? data.output
      : JSON.stringify(data.output, null, 2);
  }

  return JSON.stringify(data, null, 2);
};

const normalizeTestCase = (rawCase: any): ApiCodingTestCase | null => {
  if (!rawCase || typeof rawCase !== "object") return null;
  if (typeof rawCase.input !== "string" || typeof rawCase.output !== "string") {
    return null;
  }

  return {
    input: rawCase.input,
    output: rawCase.output,
    hidden: Boolean(rawCase.hidden),
  };
};

const normalizeCodingQuestions = (payload: any): CodingQuestionItem[] => {
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.questions)
        ? payload.questions
        : [];

  return list
    .map((raw: ApiCodingQuestion | LegacyApiQuestion | any) => {
      const id = Number(raw?.question_id ?? raw?.id);
      const title = String(raw?.question_text ?? raw?.question ?? "").trim();
      const section = String(raw?.question_section ?? raw?.section ?? "coding");

      const hasModernShape = Array.isArray(raw?.test_cases);
      const hasLegacyCodingShape =
        Array.isArray(raw?.options) && raw.options.length === 0;

      if (
        !Number.isFinite(id) ||
        !title ||
        (!hasModernShape && !hasLegacyCodingShape)
      ) {
        return null;
      }

      const testCases = hasModernShape
        ? (raw.test_cases
            .map((tc: any) => normalizeTestCase(tc))
            .filter(Boolean) as ApiCodingTestCase[])
        : [];

      return {
        question_id: id,
        title,
        description: title,
        section,
        testCases,
      };
    })
    .filter(Boolean) as CodingQuestionItem[];
};

function CodingTest() {
  const navigate = useNavigate();

  const [current, setCurrent] = useState(0);
  const [code, setCode] = useState(CODE_TEMPLATES.javascript);
  const [output, setOutput] = useState("");
  const [language, setLanguage] = useState<SupportedLanguage>("javascript");
  const [isRunning, setIsRunning] = useState(false);

  const [warningMsg, setWarningMsg] = useState<string | null>(null);
  const [showGuidelines, setShowGuidelines] = useState(true);
  const [showFullscreenRestore, setShowFullscreenRestore] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [testStarted, setTestStarted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMode, setSubmitMode] = useState<SubmitMode>("manual");
  const [timeLeft, setTimeLeft] = useState(CODING_TEST_DURATION);

  const violationsRef = useRef(0);
  const isSubmittingRef = useRef(false);
  const fullscreenExitingRef = useRef(false);
  const lastViolationTimeRef = useRef(0);
  const warningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blurStartRef = useRef<number | null>(null);
  const codeMapRef = useRef<Record<number, string>>({});
  const inputMapRef = useRef<Record<number, string>>({});

  const [questions, setQuestions] = useState<CodingQuestionItem[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [inputData, setInputData] = useState("");

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await getTestQuestionsApi();
        const codingOnly = normalizeCodingQuestions(res.data);
        setQuestions(codingOnly);
      } catch (err: any) {
        setLoadError(err?.response?.data?.detail || "Failed to load questions");
      } finally {
        setLoadingQuestions(false);
      }
    };

    fetchQuestions();
  }, []);

  useEffect(() => {
    if (current > 0 && current >= questions.length) {
      setCurrent(Math.max(questions.length - 1, 0));
    }
  }, [current, questions.length]);

  const question = questions[current] || null;
  const totalQuestions = questions.length;
  const visibleTestCases = question?.testCases.filter((tc) => !tc.hidden) ?? [];
  const hiddenTestCaseCount =
    question?.testCases.filter((tc) => tc.hidden).length ?? 0;

  const navigateToQuestion = (index: number) => {
    setCurrent(index);
    const nextQ = questions[index];
    if (nextQ) {
      setCode(codeMapRef.current[nextQ.question_id] ?? CODE_TEMPLATES[language]);
      setInputData(inputMapRef.current[nextQ.question_id] ?? "");
    }
    setOutput("");
  };

  const updateCode = (value: string) => {
    setCode(value);
    if (question) codeMapRef.current[question.question_id] = value;
  };

  const updateInputData = (value: string) => {
    setInputData(value);
    if (question) inputMapRef.current[question.question_id] = value;
  };

  const fmt = (sec: number) =>
    `${Math.floor(sec / 60)
      .toString()
      .padStart(2, "0")}:${(sec % 60).toString().padStart(2, "0")}`;

  const isLow = timeLeft < 300;

  const answeredCount = questions.filter((q) => {
    const c = codeMapRef.current[q.question_id];
    return c && c.trim() && c !== CODE_TEMPLATES[language];
  }).length;

  const showWarning = useCallback((msg: string, duration = 3000) => {
    setWarningMsg(msg);

    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    warningTimeoutRef.current = setTimeout(() => setWarningMsg(null), duration);
  }, []);

const handleSubmit = useCallback(
  async (mode: SubmitMode = "manual") => {
    if (isSubmittingRef.current) return;

    isSubmittingRef.current = true;
    setSubmitMode(mode);
    setIsSubmitting(true);

    try {
      // exit fullscreen
      if (document.fullscreenElement) {
        await document.exitFullscreen().catch(() => {});
      }

      // Save current question code before submitting
      if (question) {
        codeMapRef.current[question.question_id] = code;
      }

      // Submit ALL questions that have code written
      const submissions = questions
        .map((q) => {
          const savedCode = codeMapRef.current[q.question_id];
          if (!savedCode || !savedCode.trim()) return null;
          return submitCodeApi({
            question_id: q.question_id,
            code: savedCode,
            language,
            input_data: inputMapRef.current[q.question_id] || "",
          });
        })
        .filter(Boolean);

      if (submissions.length > 0) {
        await Promise.allSettled(submissions as Promise<any>[]);
      }

      navigate("/user/dashboard", { replace: true });
    } catch (error: any) {
      showWarning(
        error?.response?.data?.detail ||
          error?.response?.data?.message ||
          "Failed to submit code. Please try again.",
        4000,
      );
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  },
  [testStarted, questions, question, code, language, navigate, showWarning],
);

  const registerViolation = useCallback(
    (msg?: string) => {
      const now = Date.now();

      if (now - lastViolationTimeRef.current < 2000) return;

      lastViolationTimeRef.current = now;
      violationsRef.current += 1;

      if (violationsRef.current === 1) {
        showWarning(msg || "Warning: Do not perform this action again!");
        return;
      }

      if (violationsRef.current >= 2) {
        handleSubmit("violation");
      }
    },
    [handleSubmit, showWarning],
  );

  const handleAcceptGuidelines = async () => {
    setShowGuidelines(false);
    setTestStarted(true);

    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      showWarning(
        "Fullscreen request failed. Please allow fullscreen mode.",
        4000,
      );
    }
  };

  const confirmSubmit = () => {
    if (isSubmittingRef.current) return;

    if (answeredCount < totalQuestions) {
      setShowConfirmSubmit(true);
      return;
    }

    handleSubmit("manual");
  };

  const handleRun = async () => {
    if (!testStarted || !question) return;
    if (!code.trim()) {
      showWarning("Code cannot be empty.");
      return;
    }

    setIsRunning(true);
    setOutput("Sending code to backend runner...");

    try {
      const payload = {
        question_id: question.question_id,
        code,
        input_data: inputData,
        language,
      };

      const response = await runCodeApi(payload);
      setOutput(formatBackendOutput(response.data));
    } catch (error: any) {
      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to run code";

      setOutput(message);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    return () => {
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }

      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  // Timer countdown
  useEffect(() => {
    if (!testStarted) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [testStarted]);

  // Auto-submit on time expiry
  useEffect(() => {
    if (timeLeft <= 0 && testStarted && !isSubmittingRef.current) {
      showWarning("Time is up! Submitting your test.", 5000);
      handleSubmit("violation");
    }
  }, [timeLeft, testStarted, handleSubmit, showWarning]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (
        !testStarted ||
        isSubmittingRef.current ||
        fullscreenExitingRef.current ||
        showFullscreenRestore
      ) {
        return;
      }

      if (document.hidden) {
        blurStartRef.current = Date.now();
      } else {
        if (!blurStartRef.current) return;

        const duration = Date.now() - blurStartRef.current;
        if (duration > 1200) registerViolation();

        blurStartRef.current = null;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [handleSubmit, testStarted, registerViolation, showFullscreenRestore]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!testStarted || isSubmittingRef.current) return;

      if (!document.fullscreenElement) {
        const now = Date.now();
        if (now - lastViolationTimeRef.current < 3000) return;

        fullscreenExitingRef.current = true;

        setTimeout(() => {
          fullscreenExitingRef.current = false;
        }, 2000);

        registerViolation(
          "Do not exit fullscreen! Next time your test will be auto-submitted.",
        );

        if (violationsRef.current < 2) {
          setWarningMsg(null);
          setShowFullscreenRestore(true);
        }
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [testStarted, handleSubmit, showWarning, registerViolation]);

  useEffect(() => {
    if (!testStarted) return;

    const disableRightClick = (e: MouseEvent) => e.preventDefault();

    document.addEventListener("contextmenu", disableRightClick);

    return () => {
      document.removeEventListener("contextmenu", disableRightClick);
    };
  }, [testStarted]);

  useEffect(() => {
    if (!testStarted) return;

    const isEditorOrInput = (target: EventTarget | null): boolean => {
      if (!target || !(target instanceof HTMLElement)) return false;
      if (target.tagName === "TEXTAREA" || target.tagName === "INPUT") return true;
      if (target.closest(".monaco-editor")) return true;
      return false;
    };

    const preventCopy = (e: ClipboardEvent) => {
      if (!isEditorOrInput(e.target)) e.preventDefault();
    };
    const preventSelect = (e: Event) => {
      if (!isEditorOrInput(e.target)) e.preventDefault();
    };

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
  }, [testStarted]);

  useEffect(() => {
    if (!testStarted) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(e.key)) ||
        (e.ctrlKey && e.key === "U") ||
        e.key === "F5" ||
        (e.ctrlKey && ["R", "r"].includes(e.key))
      ) {
        e.preventDefault();
        registerViolation();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [testStarted, registerViolation]);

  useEffect(() => {
    const handleBlur = () => {
      if (
        !testStarted ||
        isSubmittingRef.current ||
        fullscreenExitingRef.current ||
        showFullscreenRestore
      ) {
        return;
      }

      blurStartRef.current = Date.now();
    };

    const handleFocus = () => {
      if (!blurStartRef.current) return;

      const duration = Date.now() - blurStartRef.current;

      if (duration < 1200) {
        blurStartRef.current = null;
        return;
      }

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

  useEffect(() => {
    if (!testStarted || isSubmittingRef.current) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Are you sure you want to leave?";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [testStarted]);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 font-jakarta">
      {isSubmitting && (
        <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-white/90 backdrop-blur-md">
          <div className="flex flex-col items-center gap-5 animate-fadeUp">
            <div className="relative h-16 w-16">
              <div className="absolute inset-0 rounded-full border-4 border-blue/20" />
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-blue" />
            </div>
            <div className="text-center">
              <h2 className="mb-1 text-lg font-extrabold text-navy">
                {submitMode === "violation"
                  ? "Auto-Submitting Test..."
                  : "Submitting Your Code..."}
              </h2>
              <p className="text-sm text-slate">
                {submitMode === "violation"
                  ? "Your test is being submitted due to security violations."
                  : "Please wait while we submit your solution."}
              </p>
            </div>
          </div>
        </div>
      )}

      {showGuidelines && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-[92%] max-w-lg animate-fadeUp rounded-2xl bg-white p-7 shadow-2xl">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky">
                <FiShield className="text-xl text-blue" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-navy">
                  Coding Test Guidelines
                </h2>
                <p className="text-xs text-slate">
                  Please read carefully before starting
                </p>
              </div>
            </div>

            <div className="mb-6 space-y-3">
              {[
                {
                  icon: <FiMaximize />,
                  text: "Test will run in fullscreen mode.",
                },
                {
                  icon: <FiAlertTriangle />,
                  text: "Do not switch tabs or other apps.",
                },
                {
                  icon: <FiShield />,
                  text: "Copy, paste, and right-click are disabled.",
                },
                { icon: <FiCode />, text: "Developer tools are not allowed." },
                {
                  icon: <FiAlertTriangle />,
                  text: "Two violations will auto-submit the test.",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3"
                >
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-sky text-sm text-blue">
                    {item.icon}
                  </span>
                  <p className="text-[13px] font-medium text-navy">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 border-t border-line pt-4">
              <button
                onClick={() => navigate("/user/dashboard", { replace: true })}
                className="flex-1 rounded-xl border border-line py-2.5 text-[13px] font-bold text-slate transition-colors hover:bg-gray-50"
              >
                Go Back
              </button>
              <button
                onClick={handleAcceptGuidelines}
                className="flex-1 rounded-xl bg-blue py-2.5 text-[13px] font-bold text-white shadow-sm transition-colors hover:bg-bluelt"
              >
                I Understand, Start Test
              </button>
            </div>
          </div>
        </div>
      )}

      {showFullscreenRestore && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-[88%] max-w-sm animate-fadeUp rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                <FiMaximize className="text-lg text-amber-600" />
              </div>
              <div>
                <h3 className="text-[15px] font-extrabold text-navy">
                  Fullscreen Required
                </h3>
                <p className="text-xs text-slate">
                  This counts as a violation warning
                </p>
              </div>
            </div>
            <p className="mb-5 text-[13px] text-slate">
              You exited fullscreen mode. If this happens again, your test will
              be auto-submitted.
            </p>
            <button
              onClick={async () => {
                try {
                  await document.documentElement.requestFullscreen();
                } catch {
                  showWarning(
                    "Fullscreen request failed. Please try again.",
                    3000,
                  );
                }
                setShowFullscreenRestore(false);
              }}
              className="w-full rounded-xl bg-blue py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-bluelt"
            >
              Return to Fullscreen
            </button>
          </div>
        </div>
      )}

      {warningMsg && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
          <div className="w-[88%] max-w-sm animate-fadeUp rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
                <FiAlertTriangle className="text-lg text-red-600" />
              </div>
              <h3 className="text-[15px] font-extrabold text-navy">Warning</h3>
            </div>
            <p className="mb-5 text-[13.5px] leading-relaxed text-slate">
              {warningMsg}
            </p>
            <button
              onClick={() => setWarningMsg(null)}
              className="w-full rounded-xl bg-navy py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-navy3"
            >
              Understood
            </button>
          </div>
        </div>
      )}

      {showConfirmSubmit && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
          <div className="w-[88%] max-w-sm animate-fadeUp rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                <FiAlertTriangle className="text-lg text-amber-500" />
              </div>
              <div>
                <h3 className="text-[15px] font-extrabold text-navy">
                  Confirm Submission
                </h3>
                <p className="text-xs text-slate">
                  {answeredCount}/{totalQuestions} questions answered
                </p>
              </div>
            </div>
            <p className="mb-5 text-[13px] text-slate">
              You have {totalQuestions - answeredCount} unanswered question(s).
              Submit anyway?
            </p>
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setShowConfirmSubmit(false)}
                className="flex-1 rounded-xl border border-line py-2.5 text-[13px] font-bold text-slate transition-colors hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowConfirmSubmit(false);
                  handleSubmit("manual");
                }}
                className="flex-1 rounded-xl bg-blue py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-bluelt"
              >
                Yes, Submit
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-white/85 px-4 py-3 backdrop-blur-md sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky">
            <FiCode className="text-lg text-blue" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold leading-tight text-navy">
              Coding Test
            </h1>
            <p className="text-[11px] text-slate">{totalQuestions} Questions</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-2 rounded-xl border px-3 py-2 font-mono text-base font-bold ${
              isLow
                ? "border-red-400 text-red-500 animate-pulse"
                : "border-line text-navy"
            }`}
          >
            <span className="text-xs">Time</span>
            <span>{fmt(timeLeft)}</span>
          </div>

          <div className="mr-3 hidden items-center gap-1.5 sm:flex">
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => navigateToQuestion(i)}
                className={`h-7 w-7 rounded-lg text-[11px] font-bold transition-all ${
                  i === current
                    ? "bg-blue text-white shadow-sm"
                    : "bg-slate-100 text-slate hover:bg-slate-200"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <button
            onClick={confirmSubmit}
            disabled={!testStarted || isSubmitting}
            className="flex items-center gap-1.5 rounded-xl bg-green-600 px-4 py-2 text-[12px] font-bold text-white shadow-sm transition-colors hover:bg-green-700 disabled:opacity-40"
          >
            <FiSend className="text-xs" />
            Submit Test
          </button>
        </div>
      </div>

      {loadingQuestions ? (
        <div className="flex h-[calc(100vh-57px)] flex-col items-center justify-center">
          <div className="loader" />
          <p className="mt-4 animate-pulse text-sm text-slate">
            Loading questions...
          </p>
        </div>
      ) : loadError ? (
        <div className="flex h-[calc(100vh-57px)] flex-col items-center justify-center">
          <FiAlertTriangle className="mb-3 text-3xl text-red-500" />
          <p className="text-sm font-semibold text-red-600">{loadError}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 text-xs font-semibold text-blue transition-colors hover:text-bluelt"
          >
            Retry
          </button>
        </div>
      ) : !question ? (
        <div className="flex h-[calc(100vh-57px)] flex-col items-center justify-center">
          <FiCode className="mb-3 text-3xl text-mist" />
          <p className="text-sm text-slate">No coding questions available.</p>
        </div>
      ) : (
        <div className="flex h-[calc(100vh-57px)] flex-col lg:flex-row overflow-hidden">
          <div className="flex flex-col overflow-hidden border-r border-line bg-white select-none lg:w-[42%] xl:w-[38%]">
            <div className="border-b border-line px-5 pb-4 pt-5">
              <div className="mb-2 flex items-center justify-between">
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate">
                  Q{current + 1}/{totalQuestions}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={current === 0}
                    onClick={() => navigateToQuestion(current - 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-line text-slate transition-colors hover:bg-slate-50 disabled:opacity-30"
                  >
                    <FiChevronLeft className="text-sm" />
                  </button>
                  <button
                    disabled={current === totalQuestions - 1}
                    onClick={() => navigateToQuestion(current + 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-line text-slate transition-colors hover:bg-slate-50 disabled:opacity-30"
                  >
                    <FiChevronRight className="text-sm" />
                  </button>
                </div>
              </div>

              <div className="flex items-start justify-between gap-2">
                <h2 className="text-base font-extrabold leading-snug text-navy">
                  {question.title}
                </h2>
                <span className="inline-flex rounded-lg border border-[#ccdff8] bg-sky px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-blue">
                  {question.section}
                </span>
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
              <div className="rounded-xl border border-line bg-lightbg p-4">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-mist">
                  Problem Statement
                </p>
                <p className="text-[13.5px] leading-relaxed text-slate">
                  {question.description}
                </p>
              </div>

              <div className="rounded-xl border border-line bg-white p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FiCheckCircle className="text-base text-blue" />
                    <p className="text-[12px] font-extrabold uppercase tracking-wide text-navy">
                      Sample Test Cases
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-slate">
                    {visibleTestCases.length} visible
                  </span>
                </div>

                {visibleTestCases.length === 0 ? (
                  <p className="text-[12px] italic text-slate">
                    No public test case provided for this question.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {visibleTestCases.map((tc, idx) => (
                      <div
                        key={`${question.question_id}-${idx}`}
                        className="rounded-lg border border-line/80 bg-slate-50 p-3"
                      >
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <p className="text-[11px] font-extrabold text-navy">
                            Example {idx + 1}
                          </p>
                          <button
                            onClick={() => updateInputData(tc.input)}
                            className="rounded-md border border-blue/25 bg-white px-2 py-1 text-[10px] font-bold text-blue transition-colors hover:bg-sky"
                          >
                            Use This Input
                          </button>
                        </div>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <div className="rounded-md border border-line bg-white p-2">
                            <p className="mb-1 text-[10px] font-bold uppercase text-mist">
                              Input
                            </p>
                            <pre className="whitespace-pre-wrap break-all font-mono text-[12px] text-slate">
                              {tc.input}
                            </pre>
                          </div>
                          <div className="rounded-md border border-line bg-white p-2">
                            <p className="mb-1 text-[10px] font-bold uppercase text-mist">
                              Output
                            </p>
                            <pre className="whitespace-pre-wrap break-all font-mono text-[12px] text-slate">
                              {tc.output}
                            </pre>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2.5 rounded-xl border border-dashed border-line bg-slate-50/80 p-3.5">
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-sky text-blue">
                  <FiEyeOff className="text-sm" />
                </span>
                <p className="text-[12px] font-medium text-slate">
                  {hiddenTestCaseCount} hidden test
                  {hiddenTestCaseCount === 1 ? "" : "s"} will be used during
                  evaluation.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-1 flex-col overflow-hidden bg-[#1e1e1e]">
            <div className="flex items-center justify-between border-b border-[#3c3c3c] bg-[#252526] px-4 py-2.5">
              <div className="flex items-center gap-2">
                <FiCode className="text-sm text-slate-400" />
                <span className="text-[12px] font-semibold text-slate-300">
                  Editor
                </span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={language}
                  onChange={(e) => {
                    const selectedLang = e.target.value as SupportedLanguage;
                    setLanguage(selectedLang);
                    updateCode(CODE_TEMPLATES[selectedLang]);
                    setOutput("");
                  }}
                  className="cursor-pointer rounded-lg border border-[#555] bg-blue px-3 py-1.5 text-[12px] font-medium text-white focus:outline-none focus:ring-1 focus:ring-blue/40"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                </select>

                <button
                  onClick={handleRun}
                  disabled={isRunning || !testStarted}
                  className="flex items-center gap-1.5 rounded-lg bg-blue px-3.5 py-1.5 text-[12px] font-bold text-white transition-colors hover:bg-bluelt disabled:opacity-40"
                >
                  {isRunning ? (
                    <>
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Running...
                    </>
                  ) : (
                    <>
                      <FiPlay className="text-xs" />
                      Run Code
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1">
              <Editor
                height="100%"
                language={language}
                value={code}
                onChange={(val) => updateCode(val || "")}
                theme="vs-dark"
                options={{
                  fontSize: 14,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  padding: { top: 12 },
                  lineNumbersMinChars: 3,
                  renderLineHighlight: "gutter",
                }}
              />
            </div>

            <div className="border-t border-[#3c3c3c] bg-[#202124]">
              <div className="flex items-center justify-between px-4 py-2">
                <span className="text-[12px] font-semibold text-slate-300">
                  Custom Input
                </span>
                <button
                  onClick={() => updateInputData("")}
                  className="text-[10px] font-bold text-slate-500 transition-colors hover:text-slate-300"
                >
                  Clear
                </button>
              </div>
              <textarea
                placeholder="Enter custom input..."
                value={inputData}
                onChange={(e) => updateInputData(e.target.value)}
                className="h-24 w-full resize-none bg-[#1a1a2e] px-4 py-3 font-mono text-[13px] text-slate-200 placeholder:text-slate-500 focus:outline-none"
              />
            </div>

            <div className="border-t border-[#3c3c3c]">
              <div className="flex items-center gap-2 bg-[#252526] px-4 py-2">
                <FiTerminal className="text-sm text-slate-400" />
                <span className="text-[12px] font-semibold text-slate-300">
                  Output
                </span>
                {output && (
                  <button
                    onClick={() => setOutput("")}
                    className="ml-auto text-[10px] font-bold text-slate-500 transition-colors hover:text-slate-300"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="h-40 overflow-auto bg-[#1a1a2e] px-4 py-3 font-mono text-[13px] text-green-400">
                {output ? (
                  <pre className="whitespace-pre-wrap">{output}</pre>
                ) : (
                  <p className="italic text-slate-500">
                    Run your code to see output here...
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CodingTest;
