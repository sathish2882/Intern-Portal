import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getMeApi } from "../../services/authApi";
import { capitalizeName } from "../../utils/formatName";
import {
  FiClock,
  FiCode,
  FiMonitor,
  FiMessageSquare,
  FiArrowRight,
  FiSun,
  FiMoon,
  FiSunrise,
  FiUsers,
  FiFileText,
  FiTrendingUp,
} from "react-icons/fi";

// ── Types ──────────────────────────────────────────
interface AssessmentEntry {
  id: string;
  internName: string;
  specialization: string;
  date: string;
  totalScore: number;
  maxScore: number;
  grade: string;
  batch?: string;
}

type AssessmentType = "technical" | "presentation" | "softskills";

// ── Helpers ────────────────────────────────────────
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12)
    return {
      text: "Good Morning",
      icon: <FiSunrise className="text-amber-400" />,
    };
  if (h < 17)
    return {
      text: "Good Afternoon",
      icon: <FiSun className="text-orange-400" />,
    };
  return { text: "Good Evening", icon: <FiMoon className="text-indigo-400" /> };
};

const loadAssessments = (type: AssessmentType): AssessmentEntry[] => {
  try {
    const raw = localStorage.getItem(`mentor_${type}_assessments`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const getGradeColor = (grade: string) => {
  switch (grade) {
    case "Outstanding":
      return "text-emerald-600 bg-emerald-50";
    case "Excellent":
      return "text-blue bg-sky";
    case "Good":
      return "text-amber-600 bg-amber-50";
    case "Average":
      return "text-orange-600 bg-orange-50";
    default:
      return "text-red-600 bg-red-50";
  }
};

// ── Component ──────────────────────────────────────
const MentorDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [liveTime, setLiveTime] = useState(new Date());

  const [technicalAssessments, setTechnicalAssessments] = useState<
    AssessmentEntry[]
  >([]);
  const [presentationAssessments, setPresentationAssessments] = useState<
    AssessmentEntry[]
  >([]);
  const [softskillsAssessments, setSoftskillsAssessments] = useState<
    AssessmentEntry[]
  >([]);

  useEffect(() => {
    const id = setInterval(() => setLiveTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const handler = () => {
      setTechnicalAssessments(loadAssessments("technical"));
      setPresentationAssessments(loadAssessments("presentation"));
      setSoftskillsAssessments(loadAssessments("softskills"));
    };
    handler();
    window.addEventListener("focus", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("focus", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getMeApi();
        setUserName(capitalizeName(res.data.username || "Mentor"));
      } catch {
        setUserName("Mentor");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const greeting = getGreeting();

  const formattedLiveTime = liveTime.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  const formattedDate = liveTime.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // ── Stats per type ──
  const buildStats = (assessments: AssessmentEntry[]) => {
    const total = assessments.length;
    const avgScore =
      total > 0
        ? Math.round(
            assessments.reduce(
              (sum, a) => sum + (a.totalScore / a.maxScore) * 100,
              0
            ) / total
          )
        : 0;
    const batches = new Set(assessments.map((a) => a.batch || "General"));
    return { total, avgScore, batches: batches.size };
  };

  const techStats = useMemo(
    () => buildStats(technicalAssessments),
    [technicalAssessments]
  );
  const presStats = useMemo(
    () => buildStats(presentationAssessments),
    [presentationAssessments]
  );
  const commStats = useMemo(
    () => buildStats(softskillsAssessments),
    [softskillsAssessments]
  );

  const totalAssessments =
    technicalAssessments.length +
    presentationAssessments.length +
    softskillsAssessments.length;

  const allInterns = useMemo(() => {
    const names = new Set([
      ...technicalAssessments.map((a) => a.internName),
      ...presentationAssessments.map((a) => a.internName),
      ...softskillsAssessments.map((a) => a.internName),
    ]);
    return names.size;
  }, [technicalAssessments, presentationAssessments, softskillsAssessments]);

  // ── Recent assessments ──
  const recentAssessments = useMemo(() => {
    const all = [
      ...technicalAssessments.map((a) => ({ ...a, type: "Technical" as const })),
      ...presentationAssessments.map((a) => ({ ...a, type: "Presentation" as const })),
      ...softskillsAssessments.map((a) => ({ ...a, type: "Soft Skills" as const })),
    ];
    return all
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [technicalAssessments, presentationAssessments, softskillsAssessments]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 font-jakarta">
        <div className="loader" />
        <p className="text-sm text-slate mt-4 animate-pulse">
          Loading dashboard…
        </p>
      </div>
    );
  }

  const sections = [
    {
      key: "technical",
      label: "Technical",
      icon: <FiCode className="text-blue text-lg" />,
      stats: techStats,
      color: "blue",
      bgColor: "bg-sky",
      route: "/mentor/technical",
    },
    {
      key: "presentation",
      label: "Presentation",
      icon: <FiMonitor className="text-amber-600 text-lg" />,
      stats: presStats,
      color: "amber-600",
      bgColor: "bg-amber-50",
      route: "/mentor/presentation",
    },
    {
      key: "softskills",
      label: "Soft Skills",
      icon: <FiMessageSquare className="text-emerald-600 text-lg" />,
      stats: commStats,
      color: "emerald-600",
      bgColor: "bg-emerald-50",
      route: "/mentor/softskills",
    },
  ];

  return (
    <div className="max-w-[1200px] mx-auto px-4 lg:px-8 py-6 font-jakarta text-navy animate-fadeUp">
      {/* ═══ Hero Greeting Banner ═══ */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0d1b2e] via-[#132238] to-[#1d6ede] text-white p-6 lg:p-8 mb-6">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5" />
        <div className="absolute top-1/2 right-1/4 w-20 h-20 rounded-full bg-white/[0.03]" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {greeting.icon}
              <span className="text-sm font-medium text-white/70">
                {greeting.text}
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight mb-1">
              Welcome back, {userName}!
            </h1>
            <p className="text-sm text-white/60">{formattedDate}</p>
          </div>

          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 border border-white/10">
            <FiClock className="text-xl text-white/70" />
            <p className="text-2xl font-extrabold font-mono tracking-wider">
              {formattedLiveTime}
            </p>
          </div>
        </div>
      </div>

      {/* ═══ Summary Stats ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
        <div className="bg-white border border-line rounded-xl p-4 hover:shadow-md hover:border-blue/20 transition-all">
          <div className="w-9 h-9 rounded-lg bg-sky flex items-center justify-center mb-2">
            <FiFileText className="text-blue text-base" />
          </div>
          <p className="text-xl lg:text-2xl font-extrabold">
            {totalAssessments}
          </p>
          <p className="text-[11px] text-slate mt-0.5">Total Assessments</p>
        </div>

        <div className="bg-white border border-line rounded-xl p-4 hover:shadow-md hover:border-blue/20 transition-all">
          <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center mb-2">
            <FiUsers className="text-purple-600 text-base" />
          </div>
          <p className="text-xl lg:text-2xl font-extrabold">{allInterns}</p>
          <p className="text-[11px] text-slate mt-0.5">Interns Assessed</p>
        </div>

        <div className="bg-white border border-line rounded-xl p-4 hover:shadow-md hover:border-blue/20 transition-all">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center mb-2">
            <FiTrendingUp className="text-emerald-600 text-base" />
          </div>
          <p className="text-xl lg:text-2xl font-extrabold">
            {techStats.avgScore > 0 ? `${techStats.avgScore}%` : "—"}
          </p>
          <p className="text-[11px] text-slate mt-0.5">Avg Technical Score</p>
        </div>

        <div className="bg-white border border-line rounded-xl p-4 hover:shadow-md hover:border-blue/20 transition-all">
          <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center mb-2">
            <FiClock className="text-amber-600 text-base" />
          </div>
          <p className="text-xl lg:text-2xl font-extrabold">
            {new Set([
              ...technicalAssessments.map((a) => a.batch || "General"),
              ...presentationAssessments.map((a) => a.batch || "General"),
              ...softskillsAssessments.map((a) => a.batch || "General"),
            ]).size || "—"}
          </p>
          <p className="text-[11px] text-slate mt-0.5">Batches</p>
        </div>
      </div>

      {/* ═══ Assessment Sections ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5 mb-6">
        {sections.map((sec) => (
          <div
            key={sec.key}
            className="bg-white border border-line rounded-[13px] p-5 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-10 h-10 rounded-lg ${sec.bgColor} flex items-center justify-center`}
                >
                  {sec.icon}
                </div>
                <h2 className="text-sm font-extrabold text-navy">
                  {sec.label}
                </h2>
              </div>
              <button
                onClick={() => navigate(sec.route)}
                className="text-[11px] font-semibold text-blue hover:text-bluelt flex items-center gap-1 transition-colors"
              >
                Open <FiArrowRight className="text-xs" />
              </button>
            </div>

            {/* Score ring */}
            <div className="flex items-center gap-4 mb-4">
              <div className="relative w-16 h-16 flex-shrink-0">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                  <circle
                    cx="32"
                    cy="32"
                    r="27"
                    fill="none"
                    stroke="#f0f2f5"
                    strokeWidth="5"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="27"
                    fill="none"
                    stroke={
                      sec.key === "technical"
                        ? "#1d6ede"
                        : sec.key === "presentation"
                          ? "#d97706"
                          : "#059669"
                    }
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 27}`}
                    strokeDashoffset={`${2 * Math.PI * 27 * (1 - sec.stats.avgScore / 100)}`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-extrabold text-navy">
                    {sec.stats.avgScore > 0 ? `${sec.stats.avgScore}%` : "—"}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs text-mist">Avg Score</p>
                <p className="text-sm font-bold text-navy">
                  {sec.stats.total} assessment
                  {sec.stats.total !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate">Assessments</span>
                <span className="text-xs font-bold text-navy">
                  {sec.stats.total}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate">Batches</span>
                <span className="text-xs font-bold text-navy">
                  {sec.stats.batches}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ═══ Recent Assessments ═══ */}
      <div className="bg-white border border-line rounded-[13px] p-5">
        <h2 className="text-sm font-extrabold text-navy mb-4">
          Recent Assessments
        </h2>

        {recentAssessments.length === 0 ? (
          <div className="text-center py-8">
            <FiFileText className="text-3xl text-mist mx-auto mb-2" />
            <p className="text-sm text-slate">No assessments yet</p>
            <p className="text-xs text-mist mt-1">
              Start by evaluating an intern in the Technical section
            </p>
            <button
              onClick={() => navigate("/mentor/technical")}
              className="mt-3 text-xs font-semibold text-blue hover:text-bluelt flex items-center gap-1 mx-auto transition-colors"
            >
              Go to Technical <FiArrowRight className="text-xs" />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {recentAssessments.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between p-3 rounded-xl border border-line hover:bg-lightbg transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-blue text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {a.internName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-navy truncate">
                      {a.internName}
                    </p>
                    <p className="text-[11px] text-mist">{a.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      a.type === "Technical"
                        ? "text-blue bg-sky"
                        : a.type === "Presentation"
                          ? "text-amber-600 bg-amber-50"
                          : "text-emerald-600 bg-emerald-50"
                    }`}
                  >
                    {a.type}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getGradeColor(a.grade)}`}
                  >
                    {a.grade}
                  </span>
                  <span className="text-xs font-bold text-navy">
                    {a.totalScore}/{a.maxScore}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MentorDashboard;
