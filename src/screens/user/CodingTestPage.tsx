import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { CODING_TEST } from "../../utils/codingTestData";
import { runCodingCodeApi } from "../../services/testApi";

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

      try {
        if (document.fullscreenElement) {
          await document.exitFullscreen().catch(() => {});
        }

        if (mode === "violation") {
          alert("Test auto-submitted due to security violations.");
        } else {
          alert("Code submitted!");
        }
      } finally {
        isSubmittingRef.current = false;
      }
    },
    [testStarted],
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

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {showGuidelines && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-[92%] p-7">
            <h2 className="text-lg font-bold text-navy mb-4">
              Coding Test Guidelines
            </h2>
            <ul className="space-y-2.5 text-[13px] text-slate mb-6">
              <li>1. Test will run in fullscreen mode.</li>
              <li>2. Do not switch tabs or other apps.</li>
              <li>3. Copy, paste, and right-click are disabled.</li>
              <li>4. Devtools are not allowed.</li>
              <li>5. Two violations will auto-submit the test.</li>
            </ul>

            <div className="flex items-center gap-3 pt-2 border-t border-line">
              <button
                onClick={() => navigate("/user/dashboard", { replace: true })}
                className="flex-1 py-2.5 rounded-lg border border-line text-[13px] font-bold text-slate hover:bg-gray-50"
              >
                Go Back
              </button>
              <button
                onClick={handleAcceptGuidelines}
                className="flex-1 py-2.5 rounded-lg bg-blue hover:bg-bluelt text-white text-[13px] font-bold"
              >
                I Understand, Start Test
              </button>
            </div>
          </div>
        </div>
      )}

      {showFullscreenRestore && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-[88%] p-6">
            <h3 className="text-[15px] font-bold text-navy mb-2">
              Fullscreen Required
            </h3>
            <p className="text-[13px] text-slate mb-4">
              You exited fullscreen mode. If this happens again, test will
              auto-submit.
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
              className="w-full py-2.5 rounded-lg bg-blue hover:bg-bluelt text-white text-[13px] font-bold"
            >
              Return to Fullscreen
            </button>
          </div>
        </div>
      )}

      {warningMsg && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 backdrop-blur-[2px] pointer-events-none">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-[88%] p-5 pointer-events-auto">
            <p className="text-[14px] font-semibold text-navy leading-snug mb-3">
              {warningMsg}
            </p>
            <button
              onClick={() => setWarningMsg(null)}
              className="w-full py-2 rounded-lg bg-navy hover:bg-navy3 text-white text-[13px] font-bold"
            >
              Understood
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-2">{question.title}</h2>
          <p className="text-sm text-gray-500 mb-3">
            Difficulty: {question.difficulty}
          </p>

          <p className="mb-3">{question.description}</p>

          <div className="bg-gray-100 p-3 rounded text-sm mb-3">
            {question.example}
          </div>

          <h3 className="font-semibold mb-2">Test Cases:</h3>
          {question.testCases.map((tc, i) => (
            <div key={i} className="text-sm mb-1">
              Input: {JSON.stringify(tc.input)} - Expected:{" "}
              {JSON.stringify(tc.expected)}
            </div>
          ))}

          <div className="flex gap-2 mt-4">
            <button
              disabled={current === 0}
              onClick={() => {
                setCurrent((p) => p - 1);
                setOutput("");
              }}
              className="px-3 py-1 bg-gray-300 rounded"
            >
              Prev
            </button>

            <button
              disabled={current === CODING_TEST.questions.length - 1}
              onClick={() => {
                setCurrent((p) => p + 1);
                setOutput("");
              }}
              className="px-3 py-1 bg-gray-300 rounded"
            >
              Next
            </button>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg shadow flex flex-col">
          <div className="flex justify-end items-center mb-3">
          
            <select
              value={language}
              onChange={(e) => {
                const selectedLang = e.target.value as SupportedLanguage;
                setLanguage(selectedLang);
                setCode(CODE_TEMPLATES[selectedLang]);
                setOutput("");
              }}
              className="border px-3 py-1 rounded text-sm bg-white"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
            </select>
          </div>
          <Editor
            height="300px"
            language={language}
            value={code}
            onChange={(val) => setCode(val || "")}
            theme="vs-dark"
          />

          <div className="flex gap-3 mt-4">
            <button
              onClick={handleRun}
              disabled={isRunning || !testStarted}
              className="px-4 py-2 bg-blue text-white rounded disabled:opacity-60"
            >
              {isRunning ? "Running..." : "Run"}
            </button>

            <button
              onClick={() => handleSubmit("manual")}
              disabled={!testStarted}
              className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-60"
            >
              Submit
            </button>
          </div>

          <div className="mt-4 bg-black text-green-400 p-3 rounded text-sm h-40 overflow-auto">
            <pre>{output}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CodingTest;
