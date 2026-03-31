import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaCalculator,
  FaCode,
  FaClipboardList,
  FaCheckCircle,
  FaClock,
  FaTrophy,
} from "react-icons/fa";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { startTest, getResult } from "../../redux/slices/testSlice";
import { TEST_CONFIG } from "../../utils/testData";
import { TestType } from "../../types";

const ASSESSMENTS: {
  id: TestType;
  name: string;
  meta: string;
  icon: JSX.Element;
  active: boolean;
}[] = [
  {
    id: "aptitude",
    name: TEST_CONFIG.aptitude.data.title,
    meta: `${TEST_CONFIG.aptitude.data.total} Qs · 45 min · Above Medium`,
    icon: <FaCalculator className="w-5 h-5 text-blue" />,
    active: true,
  },
  {
    id: "technical",
    name: TEST_CONFIG.technical.data.title,
    meta: `${TEST_CONFIG.technical.data.total} Qs · 30 min · Medium`,
    icon: <FaCode className="w-5 h-5 text-blue" />,
    active: true,
  },
];

const UserDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // ─── Redux State ───────────────────────────────────────────────────────────
  const { backendResult, currentUser } = useAppSelector((s) => s.test);

  // ─── Scenario flags ────────────────────────────────────────────────────────
  // Scenario 1: No test attempted (both scores null/undefined)
  // Scenario 2: One test attempted (one score present, one null/undefined)
  // Scenario 3: Both tests attempted (both scores present)

  const hasAptitude = backendResult?.aptitude_score != null;
  const hasTechnical = backendResult?.technical_score != null;

  const attemptedCount = (hasAptitude ? 1 : 0) + (hasTechnical ? 1 : 0);

  const isCompleted = attemptedCount === 2;
  const isInProgress = attemptedCount === 1;
  // (isNew removed, not used)
  const pending = ASSESSMENTS.length - attemptedCount;

  // ─── Best Score ────────────────────────────────────────────────────────────
  // Only calculated and displayed when BOTH tests are completed (Scenario 3)
  let bestPct = 0;
  if (isCompleted) {
    const totalCorrect =
      (backendResult?.aptitude_score ?? 0) +
      (backendResult?.technical_score ?? 0);
    const totalQuestions =
      TEST_CONFIG.aptitude.data.total + TEST_CONFIG.technical.data.total;
    bestPct =
      totalQuestions > 0
        ? Math.round((totalCorrect / totalQuestions) * 100)
        : 0;
  }

  // ─── Fetch backend results on mount ────────────────────────────────────────
  useEffect(() => {
    dispatch(getResult() as any);
  }, [dispatch]);

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleStart = (testType: TestType) => {
    dispatch(startTest(testType));
    navigate("/user/test");
  };

  const handleViewResults = () => {
    navigate("/user/result");
  };

  // ─── KPI Cards ─────────────────────────────────────────────────────────────
  const KPIS = [
    {
      icon: <FaClipboardList className="w-5 h-5 text-blue" />,
      label: "Tests Assigned",
      value: String(ASSESSMENTS.length),
      badgeClass: "bg-sky text-blue",
      badge: "Assigned",
    },
    {
      icon: <FaCheckCircle className="w-5 h-5 text-asuccess" />,
      label: "Completed",
      value: String(isCompleted ? 2 : isInProgress ? 1 : 0),
      badgeClass: "bg-[#ecfdf5] text-asuccess",
      badge: "Done",
    },
    {
      icon: <FaClock className="w-5 h-5 text-[#e07b00]" />,
      label: "Pending",
      value: String(isCompleted ? 0 : isInProgress ? 1 : 2),
      badgeClass: "bg-[#fff7ed] text-[#e07b00]",
      badge: "Pending",
    },
    {
      icon: <FaTrophy className="w-5 h-5 text-blue" />,
      label: "Best Score",
      value: isCompleted ? `${bestPct}%` : "—",
      badgeClass: "bg-sky text-blue",
      badge: "Best",
    },
  ];

  return (
    <div className="max-w-[1160px] mx-auto px-4 lg:px-8 py-8 font-jakarta text-navy animate-fadeUp">
      {/* Breadcrumb */}
      <p className="text-xs text-mist font-mono mb-6">
        Aptitude Portal › <span className="text-blue">Dashboard</span>
      </p>

      {/* Greeting */}
      <div className="mb-7">
        <h1 className="text-2xl font-extrabold text-navy tracking-tight mb-1">
          Good day, {currentUser?.name ?? "Intern"} 👋
        </h1>
        <p className="text-sm text-slate">
          You have active assessments waiting. Start when you're ready.
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
        {KPIS.map((k, i) => (
          <div
            key={k.label}
            className="bg-white border border-line rounded-xl p-4 lg:p-5 transition-all hover:shadow-[0_6px_20px_rgba(0,0,0,0.07)] hover:-translate-y-0.5 cursor-default"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <div className="flex items-center justify-between mb-2.5">
              <div className="w-9 h-9 bg-sky rounded-[9px] flex items-center justify-center text-lg">
                {k.icon}
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${k.badgeClass}`}
              >
                {k.badge}
              </span>
            </div>
            <p className="text-3xl font-extrabold text-navy tracking-tight">
              {k.value}
            </p>
            <p className="text-xs text-slate mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* ── Assessments Table ──────────────────────────────────────────────── */}
        <div className="xl:col-span-2 bg-white border border-line rounded-[13px] overflow-hidden">
          <div className="px-5 py-4 border-b border-line">
            <span className="text-sm font-extrabold text-navy">
              Your Assessments
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line">
                  {["Assessment", "Status", "Progress", "Score", ""].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-[0.5px] text-mist"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {ASSESSMENTS.map((a) => {
                  // Per-row: did THIS specific test get attempted?
                  const isAttempted =
                    a.id === "aptitude" ? hasAptitude : hasTechnical;
                  let displayStatus: "Completed" | "Attempted" | "New" = "New";
                  let displayProgress = 0;
                  let actionButton = null;
                  // Scenario 3: Both done
                  if (isCompleted) {
                    displayStatus = "Completed";
                    displayProgress = 100;
                    actionButton = (
                      <button
                        disabled
                        className="border border-line rounded-lg px-3 py-1.5 text-xs font-bold text-mist cursor-not-allowed bg-lightbg"
                      >
                        Completed
                      </button>
                    );
                  } else if (isInProgress && isAttempted) {
                    // Scenario 2: This test attempted
                    displayStatus = "Attempted";
                    displayProgress = 50;
                    actionButton = (
                      <button
                        disabled
                        className="border border-line rounded-lg px-3 py-1.5 text-xs font-bold text-mist cursor-not-allowed bg-lightbg"
                      >
                        Attempted
                      </button>
                    );
                  } else {
                    // Scenario 1: New, or Scenario 2: other test not attempted
                    displayStatus = "New";
                    displayProgress = 0;
                    actionButton = (
                      <button
                        onClick={() => handleStart(a.id)}
                        className="border border-blue rounded-lg px-3 py-1.5 text-xs font-bold text-blue hover:bg-sky hover:border-blue transition-all"
                      >
                        Start →
                      </button>
                    );
                  }
                  return (
                    <tr
                      key={a.id}
                      className="border-b border-line last:border-b-0"
                    >
                      {/* Assessment info */}
                      <td className="px-5 py-3.5 align-middle">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-sky rounded-lg flex items-center justify-center flex-shrink-0">
                            {a.icon}
                          </div>
                          <div>
                            <p className="text-[13px] font-bold text-navy">
                              {a.name}
                            </p>
                            <p className="text-[11px] text-mist">{a.meta}</p>
                          </div>
                        </div>
                      </td>
                      {/* Status badge */}
                      <td className="px-5 py-3.5 align-middle">
                        {!a.active ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-lightbg text-mist">
                            Soon
                          </span>
                        ) : displayStatus === "Completed" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#ecfdf5] text-asuccess">
                            ✓ Completed
                          </span>
                        ) : displayStatus === "Attempted" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#fff7ed] text-[#e07b00]">
                            ◉ Attempted
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#eef2ff] text-blue">
                            ● New
                          </span>
                        )}
                      </td>
                      {/* Progress bar */}
                      <td className="px-5 py-3.5 align-middle">
                        <div className="w-[72px] h-1 bg-line rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${displayProgress === 100 ? "bg-asuccess" : displayProgress === 50 ? "bg-[#e07b00]" : "bg-line"}`}
                            style={{ width: `${displayProgress}%` }}
                          />
                        </div>
                      </td>
                      {/* Score — hidden on dashboard, shown only on result page */}
                      <td className="px-5 py-3.5 align-middle">
                        <span className="text-[13px] font-bold text-mist">
                          —
                        </span>
                      </td>
                      {/* Action button */}
                      <td className="px-5 py-3.5 align-middle">
                        {actionButton}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Recent Activity ────────────────────────────────────────────────── */}
        <div className="bg-white border border-line rounded-[13px] overflow-hidden">
          <div className="px-5 py-4 border-b border-line">
            <span className="text-sm font-extrabold text-navy">
              Recent Activity
            </span>
          </div>
          <div className="p-5">
            {isCompleted ? (
              // Scenario 3 — both done
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-asuccess" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-navy">
                      Final Assessment Completed ✅
                    </p>
                    <p className="text-[11px] text-mist mt-0.5">
                      Total Score: {backendResult?.total_score ?? 0} · {bestPct}
                      %
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleViewResults}
                  className="w-full border border-blue rounded-lg px-3 py-2 text-xs font-bold text-blue hover:bg-sky transition-all"
                >
                  View Full Results →
                </button>
              </div>
            ) : isInProgress ? (
              // Scenario 2 — one done, one pending
              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-[#e07b00]" />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-navy">
                    Tests in Progress ⏳
                  </p>
                  <p className="text-[11px] text-mist mt-0.5">
                    {pending} test{pending > 1 ? "s" : ""} still pending.
                  </p>
                </div>
              </div>
            ) : (
              // Scenario 1 — no test started
              <p className="text-center text-sm text-mist py-6">
                No activity yet. Start a test!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
