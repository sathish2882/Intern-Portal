import { useState, useEffect, useMemo } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
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
  FiLoader,
} from "react-icons/fi";
import {
  createFeedbackApi,
  getMentorsApi,
  getMyFeedbackApi,
  deleteFeedbackApi,
} from "../../services/internApi";

// Types
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
  assigned_to: number | null;
  assigned_to_name?: string | null;
  message: string;
  createdAt: number;
  reply?: string | null;
  status?: string;
  subject?: string; // backward compatibility for old localStorage entries
}

interface FeedbackFormValues {
  category: FeedbackCategory;
  assigned_to: string;
  message: string;
}

interface Mentor {
  user_id: number;
  username: string;
}

interface CreateFeedbackPayload {
  assigned_to: number | null;
  category: FeedbackCategory;
  message: string;
}

interface CreateFeedbackResponse {
  id: number;
  assigned_to: number | null;
  category: FeedbackCategory;
  message: string;
  created_at: string;
}

interface GetFeedbackResponseItem {
  id: number;
  user_id: number;
  category: FeedbackCategory;
  assigned_to: number | null;
  assigned_to_name?: string | null;
  message: string;
  reply?: string | null;
  status: string;
  created_at: string;
}

// Constants
const CATEGORIES: {
  value: FeedbackCategory;
  label: string;
  icon: JSX.Element;
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

const feedbackValidationSchema = Yup.object({
  category: Yup.string().required("Category is required"),
  assigned_to: Yup.string().when("category", {
    is: "mentorship",
    then: (schema) => schema.required("Please select a mentor"),
    otherwise: (schema) => schema.notRequired(),
  }),
  message: Yup.string()
    .trim()
    .required("Please enter your feedback")
    .min(10, "Feedback must be at least 10 characters")
    .max(1000, "Feedback cannot exceed 1000 characters"),
});

const initialValues: FeedbackFormValues = {
  category: "general",
  assigned_to: "",
  message: "",
};

// Helpers
const generateId = () =>
  `fb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const buildFeedbackPayload = (
  values: FeedbackFormValues,
): CreateFeedbackPayload => {
  const assignedTo =
    values.category === "mentorship"
      ? values.assigned_to !== ""
        ? Number(values.assigned_to)
        : null
      : null;

  return {
    assigned_to: assignedTo,
    category: values.category,
    message: values.message.trim(),
  };
};

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

const InternFeedback = () => {
  const [entries, setEntries] = useState<FeedbackEntry[]>(loadFeedback);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<"all" | FeedbackCategory>(
    "all",
  );
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [feedBacks, setFeedBacks] = useState<FeedbackEntry[]>([]);

  const getMyFeedback = async () => {
    try {
      const res = await getMyFeedbackApi();
      console.log("My Feedback API response:", res);
      const data = Array.isArray(res.data) ? res.data : [];

      const IST_OFFSET = 5.5 * 60 * 60 * 1000;

      const mapped = data.map((item: GetFeedbackResponseItem) => ({
        id: String(item.id),
        userId: item.user_id,
        category: item.category,
        assigned_to: item.assigned_to,
        reply: item.reply,
        status: item.status,
        message: item.message,
        createdAt: new Date(item.created_at).getTime() + IST_OFFSET,
      }));
      setFeedBacks(mapped);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.detail || "Failed to load your feedback",
      );
    } finally {
      setLoadingFeedback(false);
    }
  };

  useEffect(() => {
    setLoadingFeedback(true);
    getMyFeedback();
  }, []);

  // Persist
  useEffect(() => {
    saveFeedback(entries);
  }, [entries]);

  // Mentors
  useEffect(() => {
    const loadMentors = async () => {
      try {
        const res = await getMentorsApi();
        setMentors(Array.isArray(res.data) ? res.data : []);
      } catch (err: any) {
        toast.error(err?.response?.data?.detail || "Failed to load mentors");
      }
    };

    loadMentors();
  }, []);

  // Delete
  const handleDelete = async (id: string) => {
    try {
      await deleteFeedbackApi(id);
      await getMyFeedback();
      toast.success("Feedback deleted successfully");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.detail || "Failed to delete feedback"
      );
    } finally {
      setDeleteConfirm(null);
    }
  };

  const filteredFeedback = useMemo(() => {
    if (historyFilter === "all") return feedBacks;
    return feedBacks.filter((fb) => fb.category === historyFilter);
  }, [feedBacks, historyFilter]);

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

      {/* Success Toast */}
      {submitted && (
        <div className="mb-4 flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3 animate-fadeUp">
          <FiCheckCircle className="text-green-600 text-lg flex-shrink-0" />
          <p className="text-sm font-semibold text-green-700">
            Feedback submitted successfully! Thank you for sharing.
          </p>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Left: Feedback Form */}
        <div className="lg:col-span-3 bg-white border border-line rounded-2xl p-5 lg:p-6">
          <h2 className="text-base font-extrabold text-navy mb-5 flex items-center gap-2">
            <FiSend className="text-blue" />
            Submit Feedback
          </h2>

          <Formik
            initialValues={initialValues}
            validationSchema={feedbackValidationSchema}
            onSubmit={async (values, { setSubmitting, resetForm }) => {
              try {
                const payload = buildFeedbackPayload(values);
                const res = await createFeedbackApi(payload);
                await getMyFeedback();
                const created = res?.data as CreateFeedbackResponse | undefined;
                const assignedTo = created?.assigned_to ?? payload.assigned_to;
                const selectedMentor =
                  assignedTo !== null
                    ? mentors.find((m) => m.user_id === assignedTo)
                    : null;
                const createdAtTs = created?.created_at
                  ? new Date(created.created_at).getTime()
                  : Date.now();

                const entry: FeedbackEntry = {
                  id: String(created?.id ?? generateId()),
                  category: created?.category ?? payload.category,
                  assigned_to: assignedTo,
                  assigned_to_name: selectedMentor?.username ?? null,
                  message: created?.message ?? payload.message,
                  createdAt: Number.isNaN(createdAtTs)
                    ? Date.now()
                    : createdAtTs,
                };

                setEntries((prev) => [entry, ...prev]);
                resetForm();
                setSubmitted(true);
                setTimeout(() => setSubmitted(false), 3000);
              } catch (err: any) {
                const detail = err?.response?.data?.detail;
                const msg = Array.isArray(detail)
                  ? detail
                      .map((d: any) => d?.msg)
                      .filter(Boolean)
                      .join(", ")
                  : detail || "Failed to submit feedback";
                toast.error(msg);
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {({ isSubmitting, values, touched, errors, setFieldValue }) => (
              <Form>
                {/* Category */}
                <div className="mb-4">
                  <label className="block text-xs font-bold text-slate mb-2">
                    Category
                  </label>
                  <Field name="category">
                    {({ field }: any) => (
                      <select
                        {...field}
                        onChange={(e) => {
                          const nextCategory = e.target
                            .value as FeedbackCategory;
                          setFieldValue("category", nextCategory);
                          if (nextCategory !== "mentorship") {
                            setFieldValue("assigned_to", "");
                          }
                        }}
                        className="w-full bg-lightbg border border-line rounded-lg px-3 py-2 text-sm font-medium text-slate outline-none focus:border-blue cursor-pointer"
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </Field>
                  <ErrorMessage
                    name="category"
                    component="p"
                    className="text-[11px] text-red-500 mt-1"
                  />
                </div>

                {/* Assigned Mentor */}
                {values.category === "mentorship" && (
                  <div className="mb-4">
                    <label className="block text-xs font-bold text-slate mb-2">
                      Assign To Mentor <span className="text-red-400">*</span>
                    </label>
                    <Field
                      as="select"
                      name="assigned_to"
                      className={`w-full bg-lightbg border rounded-lg px-3 py-2 text-sm font-medium text-slate outline-none focus:border-blue cursor-pointer ${
                        touched.assigned_to && errors.assigned_to
                          ? "border-red-300 bg-red-50/50 focus:border-red-400"
                          : "border-line"
                      }`}
                    >
                      <option value="">Select mentor</option>
                      {mentors.map((mentor) => (
                        <option key={mentor.user_id} value={mentor.user_id}>
                          {mentor.username}
                        </option>
                      ))}
                    </Field>
                    <ErrorMessage
                      name="assigned_to"
                      component="p"
                      className="text-[11px] text-red-500 mt-1"
                    />
                  </div>
                )}

                {/* Message */}
                <div className="mb-4">
                  <label className="block text-xs font-bold text-slate mb-2">
                    Your Feedback <span className="text-red-400">*</span>
                  </label>
                  <Field
                    as="textarea"
                    name="message"
                    placeholder="Tell us what's on your mind... Share your experience, ideas, or concerns."
                    rows={5}
                    maxLength={1000}
                    className={`w-full px-4 py-3 rounded-xl border text-sm font-medium transition-all outline-none resize-none ${
                      touched.message && errors.message
                        ? "border-red-300 bg-red-50/50 focus:border-red-400"
                        : "border-line bg-lightbg focus:border-blue focus:bg-white"
                    }`}
                  />
                  <div className="flex items-center justify-between mt-1">
                    {touched.message && errors.message ? (
                      <p className="text-[11px] text-red-500 flex items-center gap-1">
                        <FiAlertCircle className="text-xs" /> {errors.message}
                      </p>
                    ) : (
                      <span />
                    )}
                    <span className="text-[10px] text-mist">
                      {values.message.length}/1000
                    </span>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue to-bluelt text-white font-bold text-sm py-3 rounded-xl hover:shadow-lg hover:shadow-blue/25 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <FiSend className="text-base" />
                      Submit Feedback
                    </>
                  )}
                </button>
              </Form>
            )}
          </Formik>
        </div>

        {/* Right: History Panel */}
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
            {loadingFeedback && (
              <div className="flex flex-col items-center justify-center py-32 font-jakarta">
                      <FiLoader className="text-3xl text-blue animate-spin mb-3" />
                      <p className="text-sm text-slate animate-pulse">Loading feedback…</p>
                    </div>
            )}
            {filteredFeedback.length === 0 ? (
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
              filteredFeedback.map((feedback) => {
                const cat = CATEGORIES.find(
                  (c) => c.value === feedback.category,
                );
                return (
                  <div
                    key={feedback.id}
                    className="group bg-lightbg border border-line/60 rounded-xl p-3.5 hover:border-blue/20 hover:shadow-sm transition-all"
                  >
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm text-blue flex-shrink-0">
                          {cat?.icon}
                        </span>
                        <span className="text-xs font-bold text-navy truncate">
                          {feedback.category === "mentorship"
                            ? `Feedback about mentor ${mentors.find((m) => m.user_id === feedback.assigned_to)?.username ?? "Mentor"}`
                            : feedback.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {deleteConfirm === feedback.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(feedback.id)}
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
                            onClick={() => setDeleteConfirm(feedback.id)}
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
                      {feedback.message}
                    </p>

                    {/* Reply */}
                    {feedback.reply && (
                      <div className="bg-white border border-line rounded-lg p-3 mb-2">
                        <div className="flex items-center gap-2 mb-1">
                          <FiMessageCircle className="text-xs text-blue" />
                          <span className="text-[10px] font-bold text-navy">
                            Feedback Reply
                          </span>
                        </div>
                        <p className="text-[11px] text-slate leading-relaxed">
                          {feedback.reply}
                        </p>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-mist bg-gray-100 px-2 py-0.5 rounded">
                        {feedback.status}
                      </span>
                      <span className="text-[10px] text-mist">
                        {timeAgo(new Date(feedback.createdAt))}
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
