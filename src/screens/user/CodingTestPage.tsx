import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { CODING_TEST } from "../../utils/codingTestData";
import { runCodingCodeApi } from "../../services/testApi";
import {
  FiPlay,
  FiSend,
  FiChevronLeft,
  FiChevronRight,
  FiAlertTriangle,
  FiCheckCircle,
  FiCode,
  FiMaximize,
  FiShield,
  FiTerminal,
} from "react-icons/fi";

type SupportedLanguage = "javascript" | "python" | "java" | "cpp";

type SubmitMode = "manual" | "violation";

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
  if (typeof data === "string") {
    return data;
  }

  if (data?.results) {
    return JSON.stringify(data.results, null, 2);
  }

  if (data?.output) {
    if (typeof data.output === "string") {
      return data.output;
    }

    return JSON.stringify(data.output, null, 2);
  }

  return JSON.stringify(data, null, 2);
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
  const [testStarted, setTestStarted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMode, setSubmitMode] = useState<SubmitMode>("manual");

  const violationsRef = useRef(0);
  const isSubmittingRef = useRef(false);
  const fullscreenExitingRef = useRef(false);
  const lastViolationTimeRef = useRef(0);
  const warningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blurStartRef = useRef<number | null>(null);

  const question = CODING_TEST.questions[current];

  const showWarning = useCallback((msg: string, duration = 3000) => {
    setWarningMsg(msg);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    warningTimeoutRef.current = setTimeout(() => setWarningMsg(null), duration);
  }, []);

  const handleSubmit = useCallback(
    async (mode: SubmitMode = "manual") => {
      if (isSubmittingRef.current || !testStarted) return;

      isSubmittingRef.current = true;
      setSubmitMode(mode);
      setIsSubmitting(true);

      try {
        if (document.fullscreenElement) {
          await document.exitFullscreen().catch(() => {});
        }

        // Simulate submission delay (replace with actual API call)
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Navigate away after submit
        navigate("/user/dashboard", { replace: true });
      } finally {
        isSubmittingRef.current = false;
        setIsSubmitting(false);
      }
    },
    [testStarted, navigate],
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

  const handleRun = async () => {
    if (!testStarted) return;

    setIsRunning(true);
    setOutput("Sending code to backend runner...");

    try {
      const payload = {
        question_id: question.id,
        language,
        code,
      };

      const response = await runCodingCodeApi(payload);
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
    const disableRightClick = (e: MouseEvent) => e.preventDefault();

    document.addEventListener("contextmenu", disableRightClick);

    return () => {
      document.removeEventListener("contextmenu", disableRightClick);
    };
  }, []);

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
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Are you sure you want to leave?";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const difficultyColor: Record<string, string> = {
    Easy: "bg-green-100 text-green-700",
    Medium: "bg-amber-100 text-amber-700",
    Hard: "bg-red-100 text-red-700",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-jakarta select-none">
      {/* ── Submitting Overlay ── */}
      {isSubmitting && (
        <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-white/90 backdrop-blur-md">
          <div className="flex flex-col items-center gap-5 animate-fadeUp">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-extrabold text-navy mb-1">
                {submitMode === "violation" ? "Auto-Submitting Test…" : "Submitting Your Code…"}
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

      {/* ── Guidelines Modal ── */}
      {showGuidelines && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-[92%] p-7 animate-fadeUp">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                <FiShield className="text-primary text-xl" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-navy">Coding Test Guidelines</h2>
                <p className="text-xs text-slate">Please read carefully before starting</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {[
                { icon: <FiMaximize />, text: "Test will run in fullscreen mode." },
                { icon: <FiAlertTriangle />, text: "Do not switch tabs or other apps." },
                { icon: <FiShield />, text: "Copy, paste, and right-click are disabled." },
                { icon: <FiCode />, text: "Developer tools are not allowed." },
                { icon: <FiAlertTriangle />, text: "Two violations will auto-submit the test." },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3">
                  <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm flex-shrink-0">
                    {item.icon}
                  </span>
                  <p className="text-[13px] text-navy font-medium">{item.text}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-line">
              <button
                onClick={() => navigate("/user/dashboard", { replace: true })}
                className="flex-1 py-2.5 rounded-xl border border-line text-[13px] font-bold text-slate hover:bg-gray-50 transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={handleAcceptGuidelines}
                className="flex-1 py-2.5 rounded-xl bg-blue hover:bg-primary/90 text-white text-[13px] font-bold transition-colors shadow-sm"
              >
                I Understand, Start Test
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Fullscreen Restore Modal ── */}
      {showFullscreenRestore && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-[88%] p-6 animate-fadeUp">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <FiMaximize className="text-amber-600 text-lg" />
              </div>
              <div>
                <h3 className="text-[15px] font-extrabold text-navy">Fullscreen Required</h3>
                <p className="text-xs text-slate">This counts as a violation warning</p>
              </div>
            </div>
            <p className="text-[13px] text-slate mb-5">
              You exited fullscreen mode. If this happens again, your test will be auto-submitted.
            </p>
            <button
              onClick={async () => {
                try {
                  await document.documentElement.requestFullscreen();
                } catch {
                  showWarning("Fullscreen request failed. Please try again.", 3000);
                }
                setShowFullscreenRestore(false);
              }}
              className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-[13px] font-bold transition-colors"
            >
              Return to Fullscreen
            </button>
          </div>
        </div>
      )}

      {/* ── Warning Modal ── */}
      {warningMsg && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-[88%] p-6 animate-fadeUp">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <FiAlertTriangle className="text-red-600 text-lg" />
              </div>
              <h3 className="text-[15px] font-extrabold text-navy">Warning</h3>
            </div>
            <p className="text-[13.5px] text-slate leading-relaxed mb-5">{warningMsg}</p>
            <button
              onClick={() => setWarningMsg(null)}
              className="w-full py-2.5 rounded-xl bg-navy hover:bg-navy/90 text-white text-[13px] font-bold transition-colors"
            >
              Understood
            </button>
          </div>
        </div>
      )}

      {/* ── Top Bar ── */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-line px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <FiCode className="text-primary text-lg" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-navy leading-tight">{CODING_TEST.title}</h1>
            <p className="text-[11px] text-slate">{CODING_TEST.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Question indicator pills */}
          <div className="hidden sm:flex items-center gap-1.5 mr-3">
            {CODING_TEST.questions.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setCurrent(i);
                  setOutput("");
                }}
                className={`w-7 h-7 rounded-lg text-[11px] font-bold transition-all ${
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
            onClick={() => handleSubmit("manual")}
            disabled={!testStarted || isSubmitting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-[12px] font-bold disabled:opacity-40 transition-colors shadow-sm"
          >
            <FiSend className="text-xs" />
            Submit Test
          </button>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex flex-col lg:flex-row gap-0 lg:gap-0 h-[calc(100vh-57px)]">
        {/* Left: Question Panel */}
        <div className="lg:w-[42%] xl:w-[38%] flex flex-col border-r border-line bg-white overflow-hidden">
          {/* Question Header */}
          <div className="px-5 pt-5 pb-4 border-b border-line">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate bg-slate-100 px-2 py-0.5 rounded-md">
                  Q{current + 1}/{CODING_TEST.questions.length}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${difficultyColor[question.difficulty] || "bg-gray-100 text-gray-600"}`}>
                  {question.difficulty}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={current === 0}
                  onClick={() => { setCurrent((p) => p - 1); setOutput(""); }}
                  className="w-7 h-7 rounded-lg border border-line flex items-center justify-center text-slate hover:bg-slate-50 disabled:opacity-30 transition-colors"
                >
                  <FiChevronLeft className="text-sm" />
                </button>
                <button
                  disabled={current === CODING_TEST.questions.length - 1}
                  onClick={() => { setCurrent((p) => p + 1); setOutput(""); }}
                  className="w-7 h-7 rounded-lg border border-line flex items-center justify-center text-slate hover:bg-slate-50 disabled:opacity-30 transition-colors"
                >
                  <FiChevronRight className="text-sm" />
                </button>
              </div>
            </div>
            <h2 className="text-base font-extrabold text-navy">{question.title}</h2>
          </div>

          {/* Question Body */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            <p className="text-[13.5px] text-slate leading-relaxed">{question.description}</p>

            <div className="bg-slate-50 border border-line rounded-xl px-4 py-3">
              <p className="text-[11px] font-bold text-slate mb-1.5 uppercase tracking-wide">Example</p>
              <pre className="text-[13px] text-navy font-mono whitespace-pre-wrap">{question.example}</pre>
            </div>

            <div>
              <p className="text-[11px] font-bold text-slate mb-2 uppercase tracking-wide">Test Cases</p>
              <div className="space-y-2">
                {question.testCases.map((tc, i) => (
                  <div key={i} className="flex items-center gap-3 bg-slate-50 border border-line rounded-xl px-4 py-2.5">
                    <span className="w-5 h-5 rounded-md bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-slate truncate">
                        <span className="font-semibold text-navy">Input:</span>{" "}
                        <code className="text-[11.5px] bg-white px-1 py-0.5 rounded border border-line">{JSON.stringify(tc.input)}</code>
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-[12px] text-green-600 flex-shrink-0">
                      <FiCheckCircle className="text-[10px]" />
                      <code className="text-[11.5px] font-medium">{JSON.stringify(tc.expected)}</code>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Code Editor + Output */}
        <div className="flex-1 flex flex-col bg-[#1e1e1e] overflow-hidden">
          {/* Editor Toolbar */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-[#252526] border-b border-[#3c3c3c]">
            <div className="flex items-center gap-2">
              <FiCode className="text-slate-400 text-sm" />
              <span className="text-[12px] font-semibold text-slate-300">Editor</span>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={language}
                onChange={(e) => {
                  const selectedLang = e.target.value as SupportedLanguage;
                  setLanguage(selectedLang);
                  setCode(CODE_TEMPLATES[selectedLang]);
                  setOutput("");
                }}
                className="bg-blue text-white text-[12px] font-medium px-3 py-1.5 rounded-lg border border-[#555] focus:outline-none focus:ring-1 focus:ring-primary/50 cursor-pointer"
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
              </select>

              <button
                onClick={handleRun}
                disabled={isRunning || !testStarted}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-white text-[12px] font-bold disabled:opacity-40 transition-colors"
              >
                {isRunning ? (
                  <>
                    <div className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Running…
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

          {/* Monaco Editor */}
          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              language={language}
              value={code}
              onChange={(val) => setCode(val || "")}
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

          {/* Output Panel */}
          <div className="border-t border-[#3c3c3c]">
            <div className="flex items-center gap-2 px-4 py-2 bg-[#252526]">
              <FiTerminal className="text-slate-400 text-sm" />
              <span className="text-[12px] font-semibold text-slate-300">Output</span>
              {output && (
                <button
                  onClick={() => setOutput("")}
                  className="ml-auto text-[10px] font-bold text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="bg-[#1a1a2e] text-green-400 px-4 py-3 text-[13px] font-mono h-36 overflow-auto">
              {output ? (
                <pre className="whitespace-pre-wrap">{output}</pre>
              ) : (
                <p className="text-slate-500 italic">Run your code to see output here…</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CodingTest;
