import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ExperimentOutlined,
  FolderOpenOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  RadarChartOutlined,
  TrophyOutlined,
} from "@ant-design/icons";

import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { startTest } from "../../redux/slices/testSlice";
import { TEST_CONFIG } from "../../utils/testData";
import { TestType } from "../../types";

import { getUserByIdApi } from "../../services/authApi";
import { getUserId, isExamUser } from "../../utils/authCookies";

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
    meta: `${TEST_CONFIG.aptitude.data.total} Qs • 45 min • Above Medium`,
    icon: <RadarChartOutlined className="text-[19px] text-blue" />,
    active: true,
  },
  {
    id: "technical",
    name: TEST_CONFIG.technical.data.title,
    meta: `${TEST_CONFIG.technical.data.total} Qs • 30 min • Medium`,
    icon: <ExperimentOutlined className="text-[19px] text-blue" />,
    active: true,
  },
];

const UserDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [user, setUser] = useState({ name: "Intern", email: "" });

  const { resultsByType } = useAppSelector((s) => s.test);

  // 🔥 prevent multiple API calls
  const hasFetched = useRef(false);

  useEffect(() => {
    const loadUser = async () => {
      const userId = getUserId();

      if (!isExamUser() || !userId) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        const response = await getUserByIdApi(userId as string);

        const payload = response?.data ?? {};

        setUser({
          name: String(payload.name ?? payload.username ?? "User"),
          email: String(payload.email ?? ""),
        });
      } catch (error) {
        console.error("Failed to load user:", error);
      }
    };

    loadUser();
  }, []);

  const firstName = user?.name?.split(" ")[0] ?? "Intern";

  const completed = Object.values(resultsByType).filter(Boolean).length;
  const pending = ASSESSMENTS.length - completed;

  const bestPct = Object.values(resultsByType).reduce((best, item) => {
    if (!item) return best;
    return Math.max(best, Math.round((item.correct / item.total) * 100));
  }, 0);

  const recentResult =
    Object.values(resultsByType).filter(Boolean).slice(-1)[0] || null;

  const handleStart = (testType: TestType) => {
    dispatch(startTest(testType));
    navigate("/user/test");
  };

  const KPIS = useMemo(
    () => [
      {
        icon: <FolderOpenOutlined className="text-[17px] text-blue" />,
        label: "Tests Assigned",
        value: String(ASSESSMENTS.length),
        badgeClass: "bg-sky text-blue",
        badge: "Assigned",
      },
      {
        icon: <CheckCircleOutlined className="text-[17px] text-asuccess" />,
        label: "Completed",
        value: String(completed),
        badgeClass: "bg-[#ecfdf5] text-asuccess",
        badge: "Done",
      },
      {
        icon: <ClockCircleOutlined className="text-[17px] text-[#e07b00]" />,
        label: "Pending",
        value: String(pending),
        badgeClass: "bg-[#fff7ed] text-[#e07b00]",
        badge: "Pending",
      },
      {
        icon: <TrophyOutlined className="text-[17px] text-blue" />,
        label: "Best Score",
        value: bestPct ? `${bestPct}%` : "-",
        badgeClass: "bg-sky text-blue",
        badge: "Best",
      },
    ],
    [bestPct, completed, pending],
  );
  return (
    <div className="max-w-[1160px] mx-auto px-4 lg:px-8 py-8 font-jakarta text-navy animate-fadeUp">
      <p className="mb-6 text-xs font-mono text-mist">
        Aptitude Portal � <span className="text-blue">Dashboard</span>
      </p>

      <div className="mb-7">
        <h1 className="mb-1 text-[30px] font-extrabold tracking-tight text-navy">
          Good day, {firstName}
        </h1>
        <p className="text-[15px] leading-7 text-slate">
          You have active assessments waiting. Start when you're ready.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {KPIS.map((kpi, index) => (
          <div
            key={kpi.label}
            className="cursor-default rounded-xl border border-line bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,0,0,0.07)] lg:p-5"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="mb-2.5 flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-sky">
                {kpi.icon}
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${kpi.badgeClass}`}
              >
                {kpi.badge}
              </span>
            </div>
            <p className="text-[32px] font-extrabold tracking-tight text-navy">
              {kpi.value}
            </p>
            <p className="mt-1 text-[13px] font-semibold text-slate">
              {kpi.label}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="overflow-hidden rounded-[13px] border border-line bg-white xl:col-span-2">
          <div className="border-b border-line px-5 py-4">
            <span className="text-[15px] font-extrabold text-navy">
              Your Assessments
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line">
                  {["Assessment", "Status", "Progress", "Score", ""].map(
                    (heading) => (
                      <th
                        key={heading}
                        className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-[0.5px] text-mist"
                      >
                        {heading}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {ASSESSMENTS.map((assessment) => {
                  const testResult = resultsByType[assessment.id];
                  const isDone = Boolean(testResult);
                  const isPassed = testResult?.passed ?? false;

                  return (
                    <tr
                      key={assessment.id}
                      className="border-b border-line last:border-b-0"
                    >
                      <td className="px-5 py-3.5 align-middle">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-sky">
                            {assessment.icon}
                          </span>
                          <div>
                            <p className="text-[14px] font-bold text-navy">
                              {assessment.name}
                            </p>
                            <p className="text-[12px] text-slate">
                              {assessment.meta}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 align-middle">
                        {!assessment.active ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-lightbg px-2.5 py-0.5 text-[11px] font-bold text-mist">
                            Soon
                          </span>
                        ) : isDone ? (
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                              isPassed
                                ? "bg-[#ecfdf5] text-asuccess"
                                : "bg-red-50 text-danger"
                            }`}
                          >
                            {isPassed ? "Pass" : "Fail"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#ecfdf5] px-2.5 py-0.5 text-[11px] font-bold text-asuccess">
                            New
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 align-middle">
                        <div className="h-1 w-[72px] overflow-hidden rounded-full bg-line">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              isDone ? "w-full bg-asuccess" : "w-0 bg-blue"
                            }`}
                          />
                        </div>
                      </td>

                      <td className="px-5 py-3.5 align-middle">
                        <span
                          className={`text-[13px] font-bold ${
                            isDone && isPassed
                              ? "text-asuccess"
                              : isDone
                                ? "text-danger"
                                : "text-mist"
                          }`}
                        >
                          {isDone && testResult
                            ? `${testResult.correct}/${testResult.total}`
                            : "�"}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 align-middle">
                        {!assessment.active ? null : isDone ? (
                          <button
                            disabled
                            className="cursor-not-allowed rounded-lg border border-line bg-lightbg px-3 py-1.5 text-xs font-bold text-mist"
                          >
                            Attempted
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStart(assessment.id)}
                            className="rounded-lg border border-line px-3 py-1.5 text-xs font-bold text-blue transition-all hover:border-blue hover:bg-sky"
                          >
                            Start ?
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="overflow-hidden rounded-[13px] border border-line bg-white">
          <div className="border-b border-line px-5 py-4">
            <span className="text-[15px] font-extrabold text-navy">
              Recent Activity
            </span>
          </div>
          <div className="p-5">
            {recentResult ? (
              <div className="flex gap-3">
                <div
                  className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${
                    recentResult.passed ? "bg-asuccess" : "bg-[#e07b00]"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold text-navy">
                    {TEST_CONFIG[recentResult.testType].data.title}{" "}
                    {recentResult.passed ? "Passed" : "Failed"}
                  </p>
                  <p className="mt-0.5 text-[12px] text-mist">
                    Score: {recentResult.correct}/{recentResult.total} (
                    {Math.round(
                      (recentResult.correct / recentResult.total) * 100,
                    )}
                    %)
                  </p>
                </div>
                <span
                  className={`flex-shrink-0 text-[13px] font-extrabold ${
                    recentResult.passed ? "text-asuccess" : "text-danger"
                  }`}
                >
                  {recentResult.passed ? "PASS" : "FAIL"}
                </span>
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-mist">
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
