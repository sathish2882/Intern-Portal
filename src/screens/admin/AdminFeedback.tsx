import { ReactNode, useEffect, useMemo, useState } from "react";
import {
  FiAlertCircle,
  FiBookOpen,
  FiBriefcase,
  FiFilter,
  FiMessageCircle,
  FiRefreshCw,
  FiSearch,
  FiTool,
  FiUser,
  FiUsers,
  FiZap,
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
  id: string;
  category: FeedbackCategory;
  subject: string;
  message: string;
  anonymous: boolean;
  createdAt: number;
}

const STORAGE_KEY = "intern_feedback";

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

const loadFeedbackEntries = (): FeedbackEntry[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as FeedbackEntry[]) : [];

    return parsed.sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
};

const formatFullDate = (timestamp: number) =>
  new Date(timestamp).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const timeAgo = (timestamp: number): string => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const AdminFeedback = () => {
  const [entries, setEntries] = useState<FeedbackEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | FeedbackCategory>(
    "all"
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const refreshEntries = () => {
    const nextEntries = loadFeedbackEntries();
    setEntries(nextEntries);
    setSelectedId((current) => {
      if (current && nextEntries.some((entry) => entry.id === current)) {
        return current;
      }
      return nextEntries[0]?.id ?? null;
    });
  };

  useEffect(() => {
    refreshEntries();

    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key === STORAGE_KEY) {
        refreshEntries();
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const filteredEntries = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return entries.filter((entry) => {
      const matchesCategory =
        categoryFilter === "all" || entry.category === categoryFilter;
      const matchesSearch =
        !query ||
        entry.subject.toLowerCase().includes(query) ||
        entry.message.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [entries, categoryFilter, searchTerm]);

  const selectedEntry =
    filteredEntries.find((entry) => entry.id === selectedId) ??
    filteredEntries[0] ??
    null;

  const stats = useMemo(() => {
    const anonymousCount = entries.filter((entry) => entry.anonymous).length;
    const todayCount = entries.filter((entry) => {
      const entryDate = new Date(entry.createdAt);
      const now = new Date();
      return (
        entryDate.getDate() === now.getDate() &&
        entryDate.getMonth() === now.getMonth() &&
        entryDate.getFullYear() === now.getFullYear()
      );
    }).length;

    const topCategory =
      CATEGORY_META
        .map((category) => ({
          ...category,
          count: entries.filter((entry) => entry.category === category.value).length,
        }))
        .sort((a, b) => b.count - a.count)[0] ?? null;

    return {
      total: entries.length,
      anonymous: anonymousCount,
      today: todayCount,
      topCategory,
    };
  }, [entries]);

  return (
    <AdminPortalShell title="Feedback" hideNav>
      <div className="mx-auto max-w-[1280px] text-white">
        <div className="mb-8 rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-6 py-7 shadow-[0_18px_50px_rgba(0,0,0,0.22)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.32em] text-slate-400">
                Admin Workspace / Feedback
              </p>
              <h1 className="text-3xl font-extrabold tracking-tight text-white">
                Intern Feedback Monitor
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">
                Review suggestions, issues, and anonymous submissions from the
                intern portal in one place.
              </p>
            </div>

            <button
              onClick={refreshEntries}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#38bdf8]/25 bg-[#0ea5e9]/10 px-4 py-3 text-sm font-semibold text-[#bae6fd] transition-colors hover:bg-[#0ea5e9]/20"
            >
              <FiRefreshCw className="text-base" />
              Refresh Feedback
            </button>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">
              Total Entries
            </p>
            <p className="mt-3 text-3xl font-extrabold text-white">{stats.total}</p>
            <p className="mt-2 text-sm text-slate-300">
              All feedback submitted by interns.
            </p>
          </div>

          <div className="rounded-[24px] border border-[#38bdf8]/15 bg-[#0ea5e9]/10 p-5 shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#bae6fd]/80">
              Submitted Today
            </p>
            <p className="mt-3 text-3xl font-extrabold text-white">{stats.today}</p>
            <p className="mt-2 text-sm text-[#e0f2fe]/80">
              New feedback added in the current local day.
            </p>
          </div>

          <div className="rounded-[24px] border border-fuchsia-400/15 bg-fuchsia-500/10 p-5 shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-fuchsia-200/80">
              Anonymous
            </p>
            <p className="mt-3 text-3xl font-extrabold text-white">
              {stats.anonymous}
            </p>
            <p className="mt-2 text-sm text-fuchsia-100/80">
              Entries submitted without identity.
            </p>
          </div>

          <div className="rounded-[24px] border border-emerald-400/15 bg-emerald-500/10 p-5 shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-200/80">
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

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.18)] lg:p-6">
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-white">
                  Feedback Inbox
                </h2>
                <p className="mt-1 text-sm text-slate-300">
                  Filter and scan all submitted feedback.
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
                      event.target.value as "all" | FeedbackCategory
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

            <div className="space-y-3">
              {filteredEntries.length === 0 ? (
                <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[24px] border border-dashed border-white/10 bg-black/10 px-6 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#38bdf8]/20 bg-[#0ea5e9]/10 text-[#bae6fd]">
                    <FiAlertCircle className="text-xl" />
                  </div>
                  <p className="text-lg font-bold text-white">
                    No matching feedback found
                  </p>
                  <p className="mt-2 max-w-md text-sm text-slate-400">
                    Try a different category or search term, or refresh to load
                    the latest submissions.
                  </p>
                </div>
              ) : (
                filteredEntries.map((entry) => {
                  const category = CATEGORY_META.find(
                    (item) => item.value === entry.category
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
                            {entry.anonymous && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 px-2.5 py-1 text-[11px] font-bold text-fuchsia-200">
                                <FiUser />
                                Anonymous
                              </span>
                            )}
                          </div>
                          <h3 className="truncate text-base font-extrabold text-white">
                            {entry.subject}
                          </h3>
                        </div>
                        <span className="shrink-0 text-xs text-slate-400">
                          {timeAgo(entry.createdAt)}
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

          <aside className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.18)] lg:p-6">
            <h2 className="text-xl font-extrabold text-white">
              Feedback Detail
            </h2>
            <p className="mt-1 text-sm text-slate-300">
              Open an item to review the full submission.
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
                  Choose a submission from the inbox to inspect the full message.
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-5">
                <div className="rounded-[24px] border border-white/10 bg-black/15 p-5">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${
                        CATEGORY_META.find(
                          (item) => item.value === selectedEntry.category
                        )?.chipClass
                      }`}
                    >
                      {
                        CATEGORY_META.find(
                          (item) => item.value === selectedEntry.category
                        )?.icon
                      }
                      {
                        CATEGORY_META.find(
                          (item) => item.value === selectedEntry.category
                        )?.label
                      }
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300">
                      {selectedEntry.anonymous
                        ? "Submitted anonymously"
                        : "Named submission"}
                    </span>
                  </div>

                  <h3 className="text-2xl font-extrabold text-white">
                    {selectedEntry.subject}
                  </h3>
                  <p className="mt-2 text-sm text-slate-400">
                    Submitted {timeAgo(selectedEntry.createdAt)} on{" "}
                    {formatFullDate(selectedEntry.createdAt)}
                  </p>
                </div>

                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                  <p className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-slate-400">
                    Message
                  </p>
                  <p className="whitespace-pre-wrap text-sm leading-7 text-slate-200">
                    {selectedEntry.message}
                  </p>
                </div>

                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                  <p className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-slate-400">
                    Review Notes
                  </p>
                  <div className="space-y-2 text-sm text-slate-300">
                    <p>
                      Use the category chip to understand whether this belongs to
                      training, mentorship, environment, or technical workflows.
                    </p>
                    <p>
                      Anonymous entries hide the sender identity in the intern
                      flow, but the content is still fully visible here.
                    </p>
                    <p>
                      This page reads directly from the same browser storage used
                      by the intern feedback form.
                    </p>
                  </div>
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
