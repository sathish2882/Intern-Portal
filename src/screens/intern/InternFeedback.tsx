import { useState, useEffect, useMemo } from "react";
import {
  FiSend,
  FiMessageCircle,
  FiClock,
  FiCheckCircle,
  FiChevronDown,
  FiTrash2,
  FiAlertCircle,
  FiBookOpen,
  FiUsers,
  FiBriefcase,
  FiTool,
  FiZap,
} from "react-icons/fi";

// ── Types ──────────────────────────────────────────
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
  createdAt: number;
}

// ── Constants ──────────────────────────────────────
const CATEGORIES: {
  value: FeedbackCategory;
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: "general", label: "General", icon: <FiMessageCircle /> },
  { value: "training", label: "Training & Learning", icon: <FiBookOpen /> },
  { value: "mentorship", label: "Mentorship", icon: <FiUsers /> },
  {
    value: "work-environment",
    label: "Work Environment",
    icon: <FiBriefcase />,
  },
  { value: "technical", label: "Technical Issues", icon: <FiTool /> },
  { value: "suggestion", label: "Suggestions", icon: <FiZap /> },
];

const STORAGE_KEY = "intern_feedback";

// ── Helpers ────────────────────────────────────────
const generateId = () =>
  `fb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const loadFeedback = (): FeedbackEntry[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveFeedback = (entries: FeedbackEntry[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
};

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

// ── Component ──────────────────────────────────────
const InternFeedback = () => {
  const [entries, setEntries] = useState<FeedbackEntry[]>(loadFeedback);
  const [category, setCategory] = useState<FeedbackCategory>("general");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<"all" | FeedbackCategory>(
    "all",
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Persist
  useEffect(() => {
    saveFeedback(entries);
  }, [entries]);

  // ── Validation ──
  const validate = (): boolean => {
    const err: Record<string, string> = {};
    if (!subject.trim()) err.subject = "Subject is required";
    if (!message.trim()) err.message = "Please enter your feedback";
    else if (message.trim().length < 10)
      err.message = "Feedback must be at least 10 characters";
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  // ── Submit ──
  const handleSubmit = () => {
    if (!validate()) return;

    setSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      const entry: FeedbackEntry = {
        id: generateId(),
        category,
        subject: subject.trim(),
        message: message.trim(),
        createdAt: Date.now(),
      };
      setEntries((prev) => [entry, ...prev]);
      setCategory("general");
      setSubject("");
      setMessage("");
      setErrors({});
      setSubmitting(false);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    }, 800);
  };

  // ── Delete ──
  const handleDelete = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setDeleteConfirm(null);
  };

  // ── Filtered history ──
  const filteredEntries = useMemo(
    () =>
      historyFilter === "all"
        ? entries
        : entries.filter((e) => e.category === historyFilter),
    [entries, historyFilter],
  );

  return (
    <div className="max-w-[1160px] mx-auto px-4 lg:px-8 py-8 font-jakarta text-navy animate-fadeUp">
      <p className="text-xs text-mist font-mono mb-6">
        Intern Portal <span className="text-blue">/ Feedback</span>
      </p>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-7 gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-navy tracking-tight mb-1">
            Feedback
          </h1>
          <p className="text-sm text-slate">
            Share your thoughts, suggestions, and experiences.
          </p>
        </div>
      </div>

      {/* ═══ Success Toast ═══ */}
      {submitted && (
        <div className="mb-4 flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3 animate-fadeUp">
          <FiCheckCircle className="text-green-600 text-lg flex-shrink-0" />
          <p className="text-sm font-semibold text-green-700">
            Feedback submitted successfully! Thank you for sharing.
          </p>
        </div>
      )}

      {/* ═══ Main Grid ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* ── Left: Feedback Form (3 cols) ── */}
        <div className="lg:col-span-3 bg-white border border-line rounded-2xl p-5 lg:p-6">
          <h2 className="text-base font-extrabold text-navy mb-5 flex items-center gap-2">
            <FiSend className="text-blue" />
            Submit Feedback
          </h2>

          {/* Category */}
          <div className="mb-4">
            <label className="block text-xs font-bold text-slate mb-2">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as FeedbackCategory)}
              className="w-100 bg-lightbg border border-line rounded-lg px-3 py-2 text-sm font-medium text-slate outline-none focus:border-blue cursor-pointer"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Message */}
          <div className="mb-4">
            <label className="block text-xs font-bold text-slate mb-2">
              Your Feedback <span className="text-red-400">*</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (errors.message)
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.message;
                    return next;
                  });
              }}
              placeholder="Tell us what's on your mind... Share your experience, ideas, or concerns."
              rows={5}
              maxLength={1000}
              className={`w-full px-4 py-3 rounded-xl border text-sm font-medium transition-all outline-none resize-none ${
                errors.message
                  ? "border-red-300 bg-red-50/50 focus:border-red-400"
                  : "border-line bg-lightbg focus:border-blue focus:bg-white"
              }`}
            />
            <div className="flex items-center justify-between mt-1">
              {errors.message ? (
                <p className="text-[11px] text-red-500 flex items-center gap-1">
                  <FiAlertCircle className="text-xs" /> {errors.message}
                </p>
              ) : (
                <span />
              )}
              <span className="text-[10px] text-mist">
                {message.length}/1000
              </span>
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue to-bluelt text-white font-bold text-sm py-3 rounded-xl hover:shadow-lg hover:shadow-blue/25 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                <FiSend className="text-base" />
                Submit Feedback
              </>
            )}
          </button>
        </div>

        {/* ── Right: History Panel (2 cols) ── */}
        <div className="lg:col-span-2 bg-white border border-line rounded-2xl p-5 lg:p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-extrabold text-navy flex items-center gap-2">
              <FiClock className="text-blue" />
              History
            </h2>

            {/* Filter */}
            <div className="relative">
              <select
                value={historyFilter}
                onChange={(e) =>
                  setHistoryFilter(e.target.value as "all" | FeedbackCategory)
                }
                className="appearance-none bg-lightbg border border-line rounded-lg px-3 py-1.5 pr-7 text-[11px] font-semibold text-slate outline-none focus:border-blue cursor-pointer"
              >
                <option value="all">All</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
              <FiChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-mist pointer-events-none" />
            </div>
          </div>

          {/* Entries list */}
          <div className="flex-1 overflow-y-auto max-h-[520px] space-y-3 pr-1 custom-scrollbar">
            {filteredEntries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-14 h-14 rounded-full bg-sky flex items-center justify-center mb-3">
                  <FiMessageCircle className="text-blue text-xl" />
                </div>
                <p className="text-sm font-bold text-navy mb-1">
                  No feedback yet
                </p>
                <p className="text-xs text-mist">
                  Your submitted feedback will appear here.
                </p>
              </div>
            ) : (
              filteredEntries.map((entry) => {
                const cat = CATEGORIES.find((c) => c.value === entry.category);
                return (
                  <div
                    key={entry.id}
                    className="group bg-lightbg border border-line/60 rounded-xl p-3.5 hover:border-blue/20 hover:shadow-sm transition-all"
                  >
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm text-blue flex-shrink-0">
                          {cat?.icon}
                        </span>
                        <span className="text-xs font-bold text-navy truncate">
                          {entry.subject}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {deleteConfirm === entry.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(entry.id)}
                              className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md hover:bg-red-100 transition-colors"
                            >
                              Delete
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="text-[10px] font-bold text-slate bg-gray-100 px-2 py-0.5 rounded-md hover:bg-gray-200 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(entry.id)}
                            className="opacity-0 group-hover:opacity-100 text-mist hover:text-red-500 transition-all p-0.5"
                            title="Delete"
                          >
                            <FiTrash2 className="text-xs" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Message preview */}
                    <p className="text-[11px] text-slate leading-relaxed line-clamp-2 mb-2">
                      {entry.message}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-mist bg-gray-100 px-2 py-0.5 rounded">
                        {cat?.label}
                      </span>
                      <span className="text-[10px] text-mist">
                        {timeAgo(entry.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InternFeedback;
