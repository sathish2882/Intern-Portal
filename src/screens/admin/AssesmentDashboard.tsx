import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import AdminPortalShell from "../../components/layout/AdminPortalShell";
import { getExamSummaryApi, resetExamDataApi } from "../../services/authApi";
import { Button } from "antd";
import { downloadExcel } from "../../utils/download";
import { capitalizeName } from "../../utils/formatName";

interface ExamUser {
  user_id: number;
  username: string;
  name: string;
  email: string;
  aptitude_score: number;
  aptitude_percentage: number;
  technical_score: number;
  technical_percentage: number;
  total_score: number;
  total_percentage: number;
  result: string;
}

type FilterStatus = "ALL" | "PASS" | "FAIL";
type SortDirection = "asc" | "desc";
type SortKey =
  | "username"
  | "name"
  | "email"
  | "aptitude_score"
  | "technical_score"
  | "total_score"
  | "result";

const TABLE_COLUMNS: { label: string; key: SortKey }[] = [
  { label: "Username", key: "username" },
  { label: "Name", key: "name" },
  { label: "Email", key: "email" },
  { label: "Aptitude", key: "aptitude_score" },
  { label: "Technical", key: "technical_score" },
  { label: "Total", key: "total_score" },
  { label: "Result", key: "result" },
];

const STATUS_CLASSES: Record<string, string> = {
  PASS: "bg-emerald-500/15 text-emerald-300 border border-emerald-400/20",
  FAIL: "bg-red-500/15 text-red-300 border border-red-400/20",
  Ongoing: "bg-yellow-500/15 text-yellow-300 border border-yellow-400/20",
};

const InterviewDashboard = () => {
  const [data, setData] = useState<ExamUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("ALL");
  const [sortConfig, setSortConfig] = useState<{
    key: SortKey;
    direction: SortDirection;
  } | null>(null);

  const normalizeResult = (value?: string) => (value ?? "").toUpperCase();

  useEffect(() => {
    const load = async () => {
      try {
        const response = await getExamSummaryApi();
        const payload = response?.data ?? [];
        setData(Array.isArray(payload) ? payload : []);
      } catch (error: any) {
        console.error(error);
        toast.error(
          error?.response?.data?.detail || "Failed to load exam summary",
        );
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const totalUsers = data.length;
  const passCount = data.filter((u) => normalizeResult(u.result) === "PASS").length;
  const failCount = data.filter((u) => normalizeResult(u.result) === "FAIL").length;
  const avgAptitude =
    totalUsers > 0
      ? (
        data.reduce((s, u) => s + u.aptitude_percentage, 0) / totalUsers
      ).toFixed(1)
      : "0";
  const avgTechnical =
    totalUsers > 0
      ? (
        data.reduce((s, u) => s + u.technical_percentage, 0) / totalUsers
      ).toFixed(1)
      : "0";
  const topScore =
    totalUsers > 0 ? Math.max(...data.map((u) => u.total_score)) : 0;

  const stats = [
    {
      label: "Total Evaluated",
      value: totalUsers,
      hint: "All submitted assessments",
      valueClass: "text-amber-300",
    },
    {
      label: "Aptitude Avg",
      value: `${avgAptitude}%`,
      hint: "Average aptitude score",
      valueClass: "text-sky-300",
    },
    {
      label: "Technical Avg",
      value: `${avgTechnical}%`,
      hint: "Average technical score",
      valueClass: "text-emerald-300",
    },
    {
      label: "Top Score",
      value: `${topScore}/50`,
      hint: `${passCount} passed out of ${totalUsers}`,
      valueClass: "text-amber-300",
    },
  ];

  const filteredData = useMemo(() => {
    if (filterStatus === "PASS") {
      return data.filter((u) => normalizeResult(u.result) === "PASS");
    }
    if (filterStatus === "FAIL") {
      return data.filter((u) => normalizeResult(u.result) === "FAIL");
    }
    return data;
  }, [data, filterStatus]);

  const sortedFilteredData = useMemo(() => {
    if (!sortConfig) return filteredData;

    const sorted = [...filteredData];
    const { key, direction } = sortConfig;
    const order = direction === "asc" ? 1 : -1;

    sorted.sort((a, b) => {
      if (key === "aptitude_score" || key === "technical_score" || key === "total_score") {
        return (a[key] - b[key]) * order;
      }

      if (key === "result") {
        return normalizeResult(a.result).localeCompare(normalizeResult(b.result)) * order;
      }

      const aValue = String(a[key] ?? "").toLowerCase();
      const bValue = String(b[key] ?? "").toLowerCase();
      return aValue.localeCompare(bValue) * order;
    });

    return sorted;
  }, [filteredData, sortConfig]);

  const handleSort = (key: SortKey) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key, direction: "asc" };
    });
  };

  const getSortIndicator = (key: SortKey) => {
    if (sortConfig?.key !== key) return "↕";
    return sortConfig.direction === "asc" ? "↑" : "↓";
  };

  const handleResetExam = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to reset all exam data? This action cannot be undone.",
    );
    if (!confirmed) return;

    try {
      setResetting(true);
      await resetExamDataApi();
      toast.success("Exam data reset successfully");
      setData([]);
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.detail || "Failed to reset exam data");
    } finally {
      setResetting(false);
    }
  };

  return (
    <AdminPortalShell title="Admin Portal">
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="loader" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/10 bg-white/5 p-5"
              >
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400 mb-2">
                  {stat.label}
                </p>
                <p className={`text-3xl font-extrabold ${stat.valueClass}`}>
                  {stat.value}
                </p>
                <p className="text-xs text-slate-400 mt-2">{stat.hint}</p>
              </div>
            ))}
          </div>
          <div className="mb-2 flex md:items-center justify-between max-md:flex-col border-none gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { label: `All (${totalUsers})`, value: "ALL" as FilterStatus },
                { label: `Pass (${passCount})`, value: "PASS" as FilterStatus },
                { label: `Fail (${failCount})`, value: "FAIL" as FilterStatus },
              ].map((option) => {
                const active = filterStatus === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    disabled={resetting}
                    onClick={() => setFilterStatus(option.value)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                      active
                        ? "bg-blue text-white"
                        : "bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            <Button
              className="bg-red-500/30 !w-[190px]"
              type="primary"
              loading={resetting}
              onClick={handleResetExam}
            >
              Reset Exam Data
            </Button>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10">
              <h2 className="text-sm font-bold">Exam Summary</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    {TABLE_COLUMNS.map((column) => (
                      <th
                        key={column.key}
                        className="text-left px-5 py-3 text-[11px] uppercase tracking-[0.14em] text-slate-400 font-medium"
                      >
                        <button
                          type="button"
                          onClick={() => handleSort(column.key)}
                          className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
                        >
                          <span>{column.label}</span>
                          <span className="text-[11px]">
                            {getSortIndicator(column.key)}
                          </span>
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedFilteredData.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-5 py-8 text-center text-slate-400"
                      >
                        No exam data found.
                      </td>
                    </tr>
                  )}
                  {sortedFilteredData.map((user) => (
                    <tr
                      key={user.user_id}
                      className="border-b border-white/5 last:border-b-0 hover:bg-white/[0.03] transition-colors"
                    >
                      <td className="px-5 py-4 text-slate-400">
                        {user.username}
                      </td>
                      <td className="px-5 py-4 font-semibold">
                        {capitalizeName(user.name)}
                      </td>
                      <td className="px-5 py-4 text-slate-300 text-xs">
                        {user.email}
                      </td>
                      <td className="px-5 py-4 font-mono">
                        <span>{user.aptitude_score}/30</span>
                        <span className="text-xs text-slate-400 ml-1">
                          ({user.aptitude_percentage.toFixed(1)}%)
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono">
                        <span>{user.technical_score}/20</span>
                        <span className="text-xs text-slate-400 ml-1">
                          ({user.technical_percentage.toFixed(1)}%)
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono font-bold">
                        <span>{user.total_score}/50</span>
                        <span className="text-xs text-slate-400 ml-1">
                          ({user.total_percentage.toFixed(1)}%)
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${STATUS_CLASSES[normalizeResult(user.result)] ?? "bg-white/10 text-slate-300"}`}
                        >
                          {normalizeResult(user.result)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {data.length > 0 && (
            <div className="flex justify-end py-5">
              <Button
                onClick={() =>
                  downloadExcel(
                    data.map((u) => ({
                      Username: u.username,
                      Name: u.name,
                      Email: u.email,
                      "Aptitude Score": u.aptitude_score,
                      "Aptitude %": Number(u.aptitude_percentage.toFixed(1)),
                      "Technical Score": u.technical_score,
                      "Technical %": Number(u.technical_percentage.toFixed(1)),
                      "Total Score": u.total_score,
                      "Total %": Number(u.total_percentage.toFixed(1)),
                      Result: u.result,
                    })),
                    {
                      filename: "interview_results.xlsx",
                      sheetName: "Results",
                    },
                  )
                }
                type="primary"
                size="small"
              >
                Download Excel
              </Button>
            </div>
          )}
        </>
      )}
    </AdminPortalShell>
  );
};

export default InterviewDashboard;
