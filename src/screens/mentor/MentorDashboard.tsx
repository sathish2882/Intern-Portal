import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getMeApi } from "../../services/authApi";
import { getMentorDashboardApi } from "../../services/mentorApi";
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

interface DashboardSectionApi {
  assessment_type: string;
  assessments: number;
  avg_score: number;
  batches: number;
}

interface RecentAssessmentApi {
  assessment_id: number;
  intern_name: string;
  type: string;
  date: string;
}

interface MentorDashboardApiResponse {
  total_assessments: number;
  interns_assessed: number;
  avg_technical_score: number;
  batches: number;
  overall_avg?: number;
  sections: DashboardSectionApi[];
  recent_assessments: RecentAssessmentApi[];
  all_batches?: Array<number | string>;
  active_batch?: number | string;
}

interface DashboardSectionCard {
  total: number;
  avgScore: number;
  batches: number;
}

const DEFAULT_DASHBOARD: MentorDashboardApiResponse = {
  total_assessments: 0,
  interns_assessed: 0,
  avg_technical_score: 0,
  batches: 0,
  overall_avg: 0,
  sections: [],
  recent_assessments: [],
  all_batches: [],
  active_batch: "all",
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) {
    return {
      text: "Good Morning",
      icon: <FiSunrise className="text-amber-400" />,
    };
  }
  if (h < 17) {
    return {
      text: "Good Afternoon",
      icon: <FiSun className="text-orange-400" />,
    };
  }
  return {
    text: "Good Evening",
    icon: <FiMoon className="text-indigo-400" />,
  };
};

const normalizeSectionKey = (value: string) => {
  const normalized = value.toLowerCase();
  if (normalized.includes("technical")) return "technical";
  if (normalized.includes("presentation")) return "presentation";
  if (normalized.includes("soft")) return "softskills";
  return normalized;
};

const formatDateTime = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const MentorDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [liveTime, setLiveTime] = useState(new Date());
  const [dashboard, setDashboard] =
    useState<MentorDashboardApiResponse>(DEFAULT_DASHBOARD);

  useEffect(() => {
    const id = setInterval(() => setLiveTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const [meRes, dashboardRes] = await Promise.all([
          getMeApi(),
          getMentorDashboardApi(),
        ]);
        setUserName(capitalizeName(meRes.data.username || "Mentor"));
        setDashboard({
          ...DEFAULT_DASHBOARD,
          ...dashboardRes.data,
          sections: Array.isArray(dashboardRes.data?.sections)
            ? dashboardRes.data.sections
            : [],
          recent_assessments: Array.isArray(dashboardRes.data?.recent_assessments)
            ? dashboardRes.data.recent_assessments
            : [],
        });
      } catch (error: any) {
        setUserName("Mentor");
        toast.error(
          error?.response?.data?.detail || "Failed to load mentor dashboard",
        );
      } finally {
        setLoading(false);
      }
    };

    void load();
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

  const sectionStats = useMemo(() => {
    const mapped: Record<string, DashboardSectionCard> = {
      technical: { total: 0, avgScore: 0, batches: 0 },
      presentation: { total: 0, avgScore: 0, batches: 0 },
      softskills: { total: 0, avgScore: 0, batches: 0 },
    };

    dashboard.sections.forEach((section) => {
      const key = normalizeSectionKey(section.assessment_type);
      if (key in mapped) {
        mapped[key] = {
          total: Number(section.assessments) || 0,
          avgScore: Number(section.avg_score) || 0,
          batches: Number(section.batches) || 0,
        };
      }
    });

    return mapped;
  }, [dashboard.sections]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 font-jakarta">
        <div className="loader" />
        <p className="text-sm text-slate mt-4 animate-pulse">
          Loading dashboard...
        </p>
      </div>
    );
  }

  const sections = [
    {
      key: "technical",
      label: "Technical",
      icon: <FiCode className="text-blue text-lg" />,
      stats: sectionStats.technical,
      bgColor: "bg-sky",
      route: "/mentor/technical",
    },
    {
      key: "presentation",
      label: "Presentation",
      icon: <FiMonitor className="text-amber-600 text-lg" />,
      stats: sectionStats.presentation,
      bgColor: "bg-amber-50",
      route: "/mentor/presentation",
    },
    {
      key: "softskills",
      label: "Soft Skills",
      icon: <FiMessageSquare className="text-emerald-600 text-lg" />,
      stats: sectionStats.softskills,
      bgColor: "bg-emerald-50",
      route: "/mentor/softskills",
    },
  ];

  return (
    <div className="max-w-[1200px] mx-auto px-4 lg:px-8 py-6 font-jakarta text-navy animate-fadeUp">
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
        <div className="bg-white border border-line rounded-xl p-4 hover:shadow-md hover:border-blue/20 transition-all">
          <div className="w-9 h-9 rounded-lg bg-sky flex items-center justify-center mb-2">
            <FiFileText className="text-blue text-base" />
          </div>
          <p className="text-xl lg:text-2xl font-extrabold">
            {dashboard.total_assessments}
          </p>
          <p className="text-[11px] text-slate mt-0.5">Total Assessments</p>
        </div>

        <div className="bg-white border border-line rounded-xl p-4 hover:shadow-md hover:border-blue/20 transition-all">
          <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center mb-2">
            <FiUsers className="text-purple-600 text-base" />
          </div>
          <p className="text-xl lg:text-2xl font-extrabold">
            {dashboard.interns_assessed}
          </p>
          <p className="text-[11px] text-slate mt-0.5">Interns Assessed</p>
        </div>

        <div className="bg-white border border-line rounded-xl p-4 hover:shadow-md hover:border-blue/20 transition-all">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center mb-2">
            <FiTrendingUp className="text-emerald-600 text-base" />
          </div>
          <p className="text-xl lg:text-2xl font-extrabold">
            {dashboard.avg_technical_score > 0
              ? `${dashboard.avg_technical_score}%`
              : "-"}
          </p>
          <p className="text-[11px] text-slate mt-0.5">Avg Technical Score</p>
        </div>

        <div className="bg-white border border-line rounded-xl p-4 hover:shadow-md hover:border-blue/20 transition-all">
          <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center mb-2">
            <FiClock className="text-amber-600 text-base" />
          </div>
          <p className="text-xl lg:text-2xl font-extrabold">
            {dashboard.batches || "-"}
          </p>
          <p className="text-[11px] text-slate mt-0.5">Batches</p>
        </div>
      </div>

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
                    {sec.stats.avgScore > 0 ? `${sec.stats.avgScore}%` : "-"}
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

      <div className="bg-white border border-line rounded-[13px] p-5">
        <h2 className="text-sm font-extrabold text-navy mb-4">
          Recent Assessments
        </h2>

        {dashboard.recent_assessments.length === 0 ? (
          <div className="text-center py-8">
            <FiFileText className="text-3xl text-mist mx-auto mb-2" />
            <p className="text-sm text-slate">No assessments yet</p>
            <p className="text-xs text-mist mt-1">
              Start by evaluating an intern in any assessment section
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
            {dashboard.recent_assessments.map((assessment) => (
              <div
                key={assessment.assessment_id}
                className="flex items-center justify-between p-3 rounded-xl border border-line hover:bg-lightbg transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-blue text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {assessment.intern_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-navy truncate">
                      {assessment.intern_name}
                    </p>
                    <p className="text-[11px] text-mist">
                      {formatDateTime(assessment.date)}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    assessment.type.toLowerCase().includes("technical")
                      ? "text-blue bg-sky"
                      : assessment.type.toLowerCase().includes("presentation")
                        ? "text-amber-600 bg-amber-50"
                        : "text-emerald-600 bg-emerald-50"
                  }`}
                >
                  {assessment.type}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MentorDashboard;
