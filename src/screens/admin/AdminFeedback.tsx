import { ReactNode, useEffect, useMemo, useState } from "react";
import {
  getAllFeedbackApi,
  getAllMentorsApi,
  replyFeedbackApi,
} from "../../services/adminApi";
import { toast } from "react-toastify";
import {
  FiAlertCircle,
  FiBookOpen,
  FiBriefcase,
  FiFilter,
  FiMessageCircle,
  FiRefreshCw,
  FiSearch,
  FiTool,
  FiUsers,
  FiZap,
  FiCalendar,
  FiLayers,
  FiTrendingUp,
} from "react-icons/fi";
import AdminPortalShell from "../../components/layout/AdminPortalShell";

type FeedbackCategory =
  | "general"
  | "training"
  | "mentorship"
  | "work-environment"
  | "technical"
  | "suggestion";

interface FeedbackEntry {
  id: number | string;
  user_id: number;
  assigned_to: number | null;
  category: FeedbackCategory;
  message: string;
  reply?: string | null;
  status: string;
  created_at: string;
}

const CATEGORY_META: {
  value: FeedbackCategory;
  label: string;
  icon: ReactNode;
  chipClass: string;
}[] = [
  {
    value: "general",
    label: "General",
    icon: <FiMessageCircle />,
    chipClass: "border-white/10 bg-white/5 text-slate-200",
  },
  {
    value: "training",
    label: "Training & Learning",
    icon: <FiBookOpen />,
    chipClass: "border-amber-400/20 bg-amber-500/10 text-amber-200",
  },
  {
    value: "mentorship",
    label: "Mentorship",
    icon: <FiUsers />,
    chipClass: "border-[#38bdf8]/20 bg-[#0ea5e9]/10 text-[#bae6fd]",
  },
  {
    value: "work-environment",
    label: "Work Environment",
    icon: <FiBriefcase />,
    chipClass: "border-emerald-400/20 bg-emerald-500/10 text-emerald-200",
  },
  {
    value: "technical",
    label: "Technical Issues",
    icon: <FiTool />,
    chipClass: "border-rose-400/20 bg-rose-500/10 text-rose-200",
  },
  {
    value: "suggestion",
    label: "Suggestions",
    icon: <FiZap />,
    chipClass: "border-fuchsia-400/20 bg-fuchsia-500/10 text-fuchsia-200",
  },
];

const formatFullDate = (timestamp: number) =>
  new Date(timestamp).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

// Copied from InternFeedback for consistent time format
const IST_OFFSET = 5.5 * 60 * 60 * 1000;
const timeAgo = (date: Date) => {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(seconds / 3600);
  const days = Math.floor(seconds / 86400);
  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hr ago`;
  return `${days} days ago`;
};

const AdminFeedback = () => {
  const [entries, setEntries] = useState<FeedbackEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<
    "all" | FeedbackCategory
  >("all");
  const [selectedId, setSelectedId] = useState<number | string | null>(null);
  const [loading, setLoading] = useState(false); // can be used for spinner if needed
  const [replyText, setReplyText] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);
  const [mentors, setMentors] = useState<any[]>([]);
  console.log("mentors", mentors);

  const refreshEntries = async () => {
    setLoading(true);
    try {
      const res = await getAllFeedbackApi();
      setEntries(Array.isArray(res.data) ? res.data : []);
      setSelectedId((current) => {
        if (
          current &&
          res.data.some((entry: FeedbackEntry) => entry.id === current)
        ) {
          return current;
        }
        return res.data[0]?.id ?? null;
      });
    } catch (err: any) {
      toast.error("Failed to load feedbacks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshEntries();
  }, []);

  const filteredEntries = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return entries.filter((entry) => {
      const matchesCategory =
        categoryFilter === "all" || entry.category === categoryFilter;
      const matchesSearch =
        !query || (entry.message || "").toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [entries, categoryFilter, searchTerm]);

  const selectedEntry =
    filteredEntries.find((entry) => entry.id === selectedId) ??
    filteredEntries[0] ??
    null;

  const stats = useMemo(() => {
    const todayCount = entries.filter((entry) => {
      const entryDate = new Date(entry.created_at);
      const now = new Date();
      return (
        entryDate.getDate() === now.getDate() &&
        entryDate.getMonth() === now.getMonth() &&
        entryDate.getFullYear() === now.getFullYear()
      );
    }).length;
    const topCategory =
      CATEGORY_META.map((category) => ({
        ...category,
        count: entries.filter((entry) => entry.category === category.value)
          .length,
      })).sort((a, b) => b.count - a.count)[0] ?? null;
    return {
      total: entries.length,
      today: todayCount,
      topCategory,
    };
  }, [entries]);

  const loadMentors = async () => {
    try {
      const res = await getAllMentorsApi();
      setMentors(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to load mentors");
    }
  };
  useEffect(() => {
    loadMentors();
  }, []);

  return (
    <AdminPortalShell title="Feedback" hideNav>
      <div className="mx-auto max-w-[1280px] text-white">
        {loading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="rounded-xl bg-[#10131b] px-8 py-6 shadow-lg flex flex-col items-center">
              <svg
                className="animate-spin h-8 w-8 text-blue-400 mb-3"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                ></path>
              </svg>
              <span className="text-white text-lg font-bold">
                Loading feedbacks...
              </span>
            </div>
          </div>
        )}
        {/* ── Header ── */}
        <div className="mb-8 rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-6 py-7 shadow-[0_18px_50px_rgba(0,0,0,0.22)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.32em] text-slate-400">
                Admin Workspace / Feedback
              </p>
              <h1 className="text-3xl font-extrabold tracking-tight text-white">
                Feedback Monitor
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">
                Review feedback from both interns and mentors. Filter by source,
                category, or search keywords.
              </p>
            </div>

            <button
              onClick={refreshEntries}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#38bdf8]/25 bg-[#0ea5e9]/10 px-4 py-3 text-sm font-semibold text-[#bae6fd] transition-colors hover:bg-[#0ea5e9]/20"
            >
              <FiRefreshCw className="text-base" />
              Refresh
            </button>
          </div>
        </div>

        {/* ── Stats Cards ── */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">
              <FiLayers className="inline -mt-0.5 mr-1.5" />
              Total Entries
            </p>
            <p className="mt-3 text-3xl font-extrabold text-white">
              {stats.total}
            </p>
            <p className="mt-2 text-sm text-slate-300">
              Combined feedback from all sources.
            </p>
          </div>

          <div className="rounded-[24px] border border-[#38bdf8]/15 bg-[#0ea5e9]/10 p-5 shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#bae6fd]/80">
              <FiCalendar className="inline -mt-0.5 mr-1.5" />
              Today
            </p>
            <p className="mt-3 text-3xl font-extrabold text-white">
              {stats.today}
            </p>
            <p className="mt-2 text-sm text-[#e0f2fe]/80">
              New feedback added today.
            </p>
          </div>

          <div className="rounded-[24px] border border-emerald-400/15 bg-emerald-500/10 p-5 shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-200/80">
              <FiTrendingUp className="inline -mt-0.5 mr-1.5" />
              Top Category
            </p>
            <p className="mt-3 text-xl font-extrabold text-white">
              {stats.topCategory?.label ?? "No data yet"}
            </p>
            <p className="mt-2 text-sm text-emerald-100/80">
              {stats.topCategory
                ? `${stats.topCategory.count} entries in the most common category.`
                : "Submissions will populate this automatically."}
            </p>
          </div>
        </div>

        {/* ── Main Grid ── */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          {/* Inbox */}
          <section className="rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.18)] lg:p-6">
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-white">
                  Feedback Inbox
                </h2>
                <p className="mt-1 text-sm text-slate-300">
                  {filteredEntries.length}{" "}
                  {filteredEntries.length === 1 ? "entry" : "entries"} found
                </p>
              </div>
            </div>

            <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px]">
              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <FiSearch className="text-slate-400" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search by subject or message"
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                />
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <FiFilter className="text-slate-400" />
                <select
                  value={categoryFilter}
                  onChange={(event) =>
                    setCategoryFilter(
                      event.target.value as "all" | FeedbackCategory,
                    )
                  }
                  className="w-full bg-transparent text-sm text-white outline-none"
                >
                  <option value="all" className="bg-[#10131b]">
                    All Categories
                  </option>
                  {CATEGORY_META.map((category) => (
                    <option
                      key={category.value}
                      value={category.value}
                      className="bg-[#10131b]"
                    >
                      {category.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {filteredEntries.length === 0 ? (
                <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[24px] border border-dashed border-white/10 bg-black/10 px-6 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#38bdf8]/20 bg-[#0ea5e9]/10 text-[#bae6fd]">
                    <FiAlertCircle className="text-xl" />
                  </div>
                  <p className="text-lg font-bold text-white">
                    No matching feedback found
                  </p>
                  <p className="mt-2 max-w-md text-sm text-slate-400">
                    Try a different category, source, or search term.
                  </p>
                </div>
              ) : (
                filteredEntries.map((entry) => {
                  const category = CATEGORY_META.find(
                    (item) => item.value === entry.category,
                  );
                  const isActive = selectedEntry?.id === entry.id;

                  return (
                    <button
                      key={entry.id}
                      onClick={() => setSelectedId(entry.id)}
                      className={`w-full rounded-[24px] border p-4 text-left transition-all ${
                        isActive
                          ? "border-[#38bdf8]/30 bg-[#0ea5e9]/10 shadow-[0_18px_30px_rgba(14,165,233,0.12)]"
                          : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-bold ${category?.chipClass}`}
                            >
                              {category?.icon}
                              {category?.label}
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue px-2 py-0.5 text-[10px] text-slate-400">
                              {entry.category === "mentorship" ? mentors.find((m) => m.user_id === entry.assigned_to)
                                ?.username || "Unassigned" : null}
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-600/20 px-2 py-0.5 text-[10px] text-green-400">
                              {entry.category === "mentorship" ? mentors.find((m) => m.user_id === entry.assigned_to)
                                ?.tech_stack || "N/A" : null}
                            </span>
                          </div>
                          <h3 className="truncate text-base font-extrabold text-white">
                            {entry.message.slice(0, 60)}
                          </h3>
                        </div>
                        <span className="shrink-0 text-xs text-slate-400">
                          {timeAgo(
                            new Date(
                              new Date(entry.created_at).getTime() + IST_OFFSET,
                            ),
                          )}
                        </span>
                      </div>

                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-300">
                        {entry.message}
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          </section>

          {/* Detail Panel */}
          <aside className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.18)] lg:p-6">
            <h2 className="text-xl font-extrabold text-white">
              Feedback Detail
            </h2>
            <p className="mt-1 text-sm text-slate-300">
              Select an item to review the full submission.
            </p>

            {!selectedEntry ? (
              <div className="mt-6 flex min-h-[360px] flex-col items-center justify-center rounded-[24px] border border-dashed border-white/10 bg-black/10 px-6 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-300">
                  <FiMessageCircle className="text-xl" />
                </div>
                <p className="text-lg font-bold text-white">
                  No feedback selected
                </p>
                <p className="mt-2 max-w-sm text-sm text-slate-400">
                  Choose a submission from the inbox to inspect the full
                  message.
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-5">
                {/* Meta */}
                <div className="rounded-[24px] border border-white/10 bg-black/15 p-5">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${
                        CATEGORY_META.find(
                          (item) => item.value === selectedEntry.category,
                        )?.chipClass
                      }`}
                    >
                      {
                        CATEGORY_META.find(
                          (item) => item.value === selectedEntry.category,
                        )?.icon
                      }
                      {
                        CATEGORY_META.find(
                          (item) => item.value === selectedEntry.category,
                        )?.label
                      }
                    </span>
                  </div>
                  <h3 className="text-2xl font-extrabold text-white">
                    Feedback Detail
                  </h3>
                  <p className="mt-2 text-sm text-slate-400">
                    Submitted{" "}
                    {timeAgo(
                      new Date(
                        new Date(selectedEntry.created_at).getTime() +
                          IST_OFFSET,
                      ),
                    )}{" "}
                    on{" "}
                    {formatFullDate(
                      new Date(selectedEntry.created_at).getTime() + IST_OFFSET,
                    )}
                  </p>
                </div>

                {/* Message */}
                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                  <p className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-slate-400">
                    Message
                  </p>
                  <p className="whitespace-pre-wrap text-sm leading-7 text-slate-200">
                    {selectedEntry.message}
                  </p>
                </div>

                {/* Reply Section */}
                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                  <p className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-slate-400">
                    {selectedEntry.status === "pending"
                      ? "Reply"
                      : "Your Reply"}
                  </p>
                  {selectedEntry.status === "pending" ? (
                    <div className="flex flex-col gap-3">
                      <textarea
                        className="w-full rounded-lg border border-slate-600 bg-black/30 p-2 text-sm text-white"
                        rows={3}
                        placeholder="Type your reply..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        disabled={replyLoading}
                      />
                      <button
                        className="self-end rounded-lg bg-blue px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"
                        onClick={async () => {
                          setReplyLoading(true);
                          try {
                            await replyFeedbackApi(selectedEntry.id, replyText);
                            toast.success("Reply sent successfully");
                            setReplyText("");
                            refreshEntries();
                          } catch (err: any) {
                            toast.error("Failed to send reply");
                          } finally {
                            setReplyLoading(false);
                          }
                        }}
                        disabled={!replyText.trim() || replyLoading}
                      >
                        {replyLoading ? "Sending..." : "Send Reply"}
                      </button>
                    </div>
                  ) : (
                    <div className="rounded bg-slate-800 p-3 text-sm text-slate-200">
                      {selectedEntry.reply || "No reply yet."}
                    </div>
                  )}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </AdminPortalShell>
  );
};

export default AdminFeedback;
