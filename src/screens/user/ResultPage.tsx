import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { getResult } from "../../redux/slices/testSlice";
import {
  TEST_CONFIG,
  OVERALL_PASS_MARK,
  SCHOLARSHIP_THRESHOLD,
  TOTAL_MARKS,
} from "../../utils/testData";

const ResultPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { backendResult, loading } = useAppSelector((s) => s.test);

  // Always fetch fresh results on mount
  useEffect(() => {
    dispatch(getResult() as any);
  }, [dispatch]);

  // Validate status and check for test completion
  useEffect(() => {
    if (!loading && backendResult && backendResult.status !== "completed") {
      console.log("Status is not 'completed':", backendResult.status);
      navigate("/user/dashboard", { replace: true });
    }
  }, [backendResult, loading, navigate]);

  //ALERT MESSAGE
  useEffect(() => {
    const pendingAlert = sessionStorage.getItem("test_alert_message");
    if (pendingAlert) {
      alert(pendingAlert);
      sessionStorage.removeItem("test_alert_message");
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-lightbg">
        <p className="text-slate">Loading results...</p>
      </div>
    );
  }

  if (!backendResult) return null;

  // =========================
  // INDIVIDUAL TEST RESULTS - Use Backend Data Directly
  // =========================

  // Get data for each test from BACKEND (not local Redux calculations)
  const getTestResult = (testType: "aptitude" | "technical" | "coding") => {
    const isCoding = testType === "coding";
    const backendScore =
      testType === "coding"
        ? (backendResult?.coding_score ?? 0)
        : (backendResult?.[`${testType}_score`] ?? 0);
    const totalQuestions = TEST_CONFIG[testType].data.total;

    // Calculate percentage based on backend score and test total
    const passQuestions = TEST_CONFIG[testType].data.pass;
    const marksPerQuestion = isCoding ? 5 : 1; // Coding questions are worth more
    const testPass = passQuestions * marksPerQuestion;
    const testTotal = totalQuestions * marksPerQuestion;
    const testPercentage =
      testTotal > 0 ? Math.round((backendScore / testTotal) * 100) : 0;

    // For display: show questions passed / total questions
    const questionsCorrect = isCoding
      ? Math.round(backendScore / marksPerQuestion)
      : backendScore;

    return {
      testType,
      score: backendScore, // From backend (marks)
      total: testTotal, // Total marks for this test
      pass: testPass, // Pass marks
      percentage: testPercentage, // Calculate from backend score
      name: TEST_CONFIG[testType].data.title,
      questionsCorrect, // Number of questions passed
      totalQuestions, // Number of questions
    };
  };

  const aptitudeResult = getTestResult("aptitude");
  const technicalResult = getTestResult("technical");
  const codingResult = getTestResult("coding");

  // =========================
  // 🔥 CUMULATIVE RESULTS - Calculate from scores, not backend percentage
  // =========================
  const totalScore = backendResult?.total_score ?? 0;
  const totalPercentage =
    TOTAL_MARKS > 0 ? Math.round((totalScore / TOTAL_MARKS) * 100) : 0;
  const cumulativePassed = totalScore >= OVERALL_PASS_MARK;
  const scholarshipEligible = totalScore > SCHOLARSHIP_THRESHOLD;

  console.log("ResultPage - Calculated Percentage:", {
    totalScore,
    TOTAL_MARKS,
    totalPercentage,
    backendPercentage: backendResult?.percentage,
  });

  // =========================
  // NO RETAKES - Only one attempt per test
  // =========================

  return (
    <div className="h-screen flex flex-col bg-lightbg font-jakarta text-navy overflow-y-auto">
      <div className="max-w-[900px] mx-auto w-full flex-1 flex flex-col justify-center px-4 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-4 text-center">
          <p className="text-sm text-mist font-mono mb-2">
            Aptitude Portal › <span className="text-blue">Results</span>
          </p>
          <h1 className="text-2xl font-extrabold text-navy mb-1">
            Assessment Results
          </h1>
          <p className="text-sm text-slate">
            Your complete performance summary across all tests
          </p>
        </div>

        {/* Cumulative Summary Card */}
        <div
          className={`rounded-[16px] border border-line p-5 mb-4 text-center ${
            cumulativePassed
              ? "bg-gradient-to-br from-[#ecfdf5] to-[#d1fae5]"
              : "bg-gradient-to-br from-[#fef2f2] to-[#fee2e2]"
          }`}
        >
          <p className="text-sm font-mono text-mist mb-2 uppercase">
            Overall Result
          </p>
          <h2
            className={`text-2xl font-extrabold mb-1 ${
              cumulativePassed ? "text-[#065f46]" : "text-[#991b1b]"
            }`}
          >
            {cumulativePassed
              ? "🎉 CONGRATULATIONS! YOU PASSED"
              : "❌ ASSESSMENT NOT PASSED"}
          </h2>
          <p
            className={`text-sm font-bold mb-4 ${
              cumulativePassed ? "font-semibold text-xl text-black/70 text-center" : "text-[#b91c1c]"
            }`}
          >
            {scholarshipEligible
              ? "You are eligible for a scholarship under the Maestro program (via M-Guru)"
              : "You're not eligible for the sponsorship benefit."}
          </p>
          <div className="inline-flex items-center gap-6 bg-white rounded-xl px-6 py-4 shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
            <div>
              <p className="text-4xl font-extrabold text-navy">
                {totalPercentage}%
              </p>
              <p className="text-xs text-mist mt-1">Overall Score</p>
            </div>
            <div className="text-left">
              <p className="text-xl font-bold text-navy">
                {totalScore} / {TOTAL_MARKS}
              </p>
              <p className="text-xs text-slate mt-1">Total Marks</p>
            </div>
          </div>
        </div>

        {/* Individual Test Results Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          {[aptitudeResult, technicalResult, codingResult].map((testResult) => {
            const testPassed = testResult.score >= testResult.pass;
            return (
              <div
                key={testResult.testType}
                className="bg-white border border-line rounded-[13px] overflow-hidden"
              >
                <div
                  className={`px-5 py-3 border-b border-line ${
                    testPassed ? "bg-[#ecfdf5]" : "bg-[#fef2f2]"
                  }`}
                >
                  <h3
                    className={`text-base font-extrabold ${
                      testPassed ? "text-[#065f46]" : "text-[#991b1b]"
                    }`}
                  >
                    {testResult.name}
                  </h3>
                  <p
                    className={`text-xs mt-0.5 font-semibold ${
                      testPassed ? "text-[#047857]" : "text-[#b91c1c]"
                    }`}
                  >
                    {testPassed ? "✓ Passed" : "✗ Did not pass"}
                  </p>
                </div>
                <div className="px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-extrabold text-navy">
                        {testResult.percentage}%
                      </p>
                      <p className="text-xs text-mist mt-0.5">Score %</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-navy">
                        {testResult.questionsCorrect} /{" "}
                        {testResult.totalQuestions}
                      </p>
                      <p className="text-xs text-slate mt-0.5">Questions</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pass Mark Info */}
        <div className="bg-sky border border-[#ccdff8] rounded-[9px] px-5 py-3 text-center mb-4">
          <p className="text-xs font-bold text-blue uppercase">Pass Criteria</p>
          <p className="text-sm text-navy font-semibold mt-1">
            Aptitude: {TEST_CONFIG.aptitude.data.pass}/
            {TEST_CONFIG.aptitude.data.total} · Tech:{" "}
            {TEST_CONFIG.technical.data.pass}/{TEST_CONFIG.technical.data.total}{" "}
            · Coding: {TEST_CONFIG.coding.data.pass}/
            {TEST_CONFIG.coding.data.total} · Overall Pass: {OVERALL_PASS_MARK}/
            {TOTAL_MARKS}
          </p>
          <p className="text-xs text-navy mt-1">
            Score above {SCHOLARSHIP_THRESHOLD} to qualify for scholarship
            benefits
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate("/user/dashboard")}
            className="flex-1 bg-blue text-white py-2.5 rounded-lg text-sm font-bold hover:bg-bluelt transition-all"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultPage;
