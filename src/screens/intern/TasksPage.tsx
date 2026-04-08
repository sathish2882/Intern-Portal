import { useState, useEffect } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import {
  FiPlus,
  FiPlay,
  FiPause,
  FiSquare,
  FiCheckCircle,
  FiCircle,
  FiCalendar,
  FiLoader,
  FiAlertCircle,
  FiRefreshCw,
  FiEdit2,
  FiEye,
} from "react-icons/fi";
import { toast } from "react-toastify";
import {
  createTaskApi,
  getTasksApi,
  startTaskApi,
  pauseTaskApi,
  resumeTaskApi,
  endTaskApi,
  updateTaskApi,
  getMentorsApi,
  getTaskApi,
} from "../../services/internApi";

// View Task Modal state and handler must be inside the component, not at top-level
import { getMeApi } from "../../services/authApi";

// ── Types ──────────────────────────────────────────
interface Task {
  task_id: number;
  user_id: number;
  title: string;
  status: number;
  start_time: string | null;
  completion_time: string | null;
  created_at: string;
  created_by: number;
  updated_at: string;
  due_time: string;
  is_editable: boolean;
  is_overdue: boolean;
  is_paused?: boolean;
  description?: string;
  priority?: string | number;
}

interface UserInfo {
  user_id: number;
  username: string;
}

const STATUS_CONFIG: Record<
  number,
  { label: string; color: string; bg: string; dot: string }
> = {
  1: {
    label: "To Do",
    color: "text-amber-600",
    bg: "bg-amber-50",
    dot: "bg-amber-500",
  },
  2: { label: "In Progress", color: "text-blue", bg: "bg-sky", dot: "bg-blue" },
  3: {
    label: "Completed",
    color: "text-green-600",
    bg: "bg-green-50",
    dot: "bg-green-500",
  },
  4: {
    label: "paused",
    color: "text-orange-6oo",
    bg: "bg-orange-50",
    dot: "bg-orange-500",
  },
};

const getStatusCfg = (status: number) =>
  STATUS_CONFIG[status] || {
    label: "Unknown",
    color: "text-mist",
    bg: "bg-gray-100",
    dot: "bg-gray-400",
  };

const titleArray = [
  { option: "Documentation", value: "Documentation" },
  { option: "Mentor session", value: "Mentor-session" },
  { option: "Daily Standup Update", value: "Daily-Standup-Update" },
  { option: "Knowledge Base Update", value: "Knowledge-Base-Update" },
  { option: "Internal Team Coordination", value: "Internal-Team-Coordination" },
  { option: "Feedback working", value: "Feedback-working" },
  { option: "Documentation Writing", value: "Documentation-Writing" },
  { option: "Report Preparation", value: "Report-Preparation" },
  { option: "Presentation", value: "Presentation" },
  { option: "One to One Meeting", value: "One-to-One-Meeting" },
];

// ── Component ──────────────────────────────────────
const TasksPage = () => {
  // View Task Modal (no API call, use tasks array)
  const [viewTask, setViewTask] = useState<Task | null>(null);
  const handleViewTask = (taskId: number) => {
    const found = tasks.find((t) => t.task_id === taskId);
    if (found) setViewTask(found);
    else toast.error("Task not found");
  };
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  // Formik will manage newTitle, dueDate, dueTime, description, status, owner, priority
  const [filter, setFilter] = useState<"all" | number>("all");

  // Pause reason modal
  const [pauseTarget, setPauseTarget] = useState<Task | null>(null);
  const [pauseReason, setPauseReason] = useState("");
  const [pausing, setPausing] = useState(false);

  // Track which task action is in-flight
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Edit task modal
  const [editTarget, setEditTarget] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [updating, setUpdating] = useState(false);
  const [mentors, setMentors] = useState<any[]>([]);

  // ── Fetch user + tasks ──
  const fetchData = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const meRes = await getMeApi();
      const u: UserInfo = {
        user_id: meRes.data.user_id,
        username: meRes.data.username,
      };
      setUser(u);

      try {
        const tasksRes = await getTasksApi();
        console.log("Fetched tasks:", tasksRes.data);
        setTasks(Array.isArray(tasksRes.data) ? tasksRes.data : []);
      } catch {
        setTasks([]);
      }
    } catch {
      setLoadError(true);
      toast.error("Failed to load user info");
    } finally {
      setLoading(false);
    }
  };

  // Silent refresh — no full-page loader
  const refreshTasks = async () => {
    try {
      const tasksRes = await getTasksApi();
      setTasks(Array.isArray(tasksRes.data) ? tasksRes.data : []);
    } catch {
      // keep current list
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ── Create task ──
  const addTask = async (values: any, { setSubmitting, resetForm }: any) => {
    if (!user) return;
    setCreating(true);
    try {
      const dueDateTime = `${values.dueDate} ${values.dueTime}`;
      const status =
        values.status === "not-started"
          ? 1
          : values.status === "inprogress"
            ? 2
            : 3;
      const priority =
        values.priority === "high" ? 1 : values.priority === "low" ? 3 : 2;
      const payload = {
        user_id: user.user_id,  
        title: values.newTitle,
        status: status,
        created_by: values.owner,
        due_time: dueDateTime,
        description: values.description,
        priority: priority,
      };
      console.log("Creating task with payload:", payload);
      await createTaskApi(payload);

      resetForm();
      setShowCreate(false);
      toast.success("Task created successfully");
      await refreshTasks();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to create task");
    } finally {
      setCreating(false);
      setSubmitting(false);
    }
  };

  // ── Start task ──
  const handleStart = async (task: Task) => {
    setActionLoading(task.task_id);
    try {
      await startTaskApi(task.task_id);
      toast.success("Task started");
      await refreshTasks();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to start task");
    } finally {
      setActionLoading(null);
    }
  };

  // ── Pause task — open reason popup ──
  const openPauseModal = (task: Task) => {
    setPauseTarget(task);
    setPauseReason("");
  };

  const confirmPause = async () => {
    if (!pauseTarget || !pauseReason.trim()) return;
    setPausing(true);
    try {
      await pauseTaskApi(pauseTarget.task_id, pauseReason.trim());
      toast.success("Task paused");
      setPauseTarget(null);
      setPauseReason("");
      await refreshTasks();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to pause task");
    } finally {
      setPausing(false);
    }
  };
  const handleResume = async (task: Task) => {
    setActionLoading(task.task_id);
    try {
      await resumeTaskApi(task.task_id);
      toast.success("Task resumed");
      await refreshTasks();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to resume task");
    } finally {
      setActionLoading(null);
    }
  };

  //get mentors
  const getMentors = async () => {
    try {
      const res = await getMentorsApi();
      setMentors(res.data);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to get mentors");
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    getMentors();
  }, []);

  // ── End task ──
  const handleEnd = async (task: Task) => {
    setActionLoading(task.task_id);
    try {
      await endTaskApi(task.task_id);
      toast.success("Task completed");
      await refreshTasks();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to end task");
    } finally {
      setActionLoading(null);
    }
  };

  // ── Edit task ──
  const openEditModal = (task: Task) => {
    setEditTarget(task);
    setEditTitle(task.title);
    setEditDueDate(task.due_time ? task.due_time.split("T")[0] : "");
  };


  const time = new Date().toISOString();
  console.log(time);

  // ── Filters ──
  const filtered =
    filter === "all" ? tasks : tasks.filter((t) => t.status === filter);
  const counts = {
    all: tasks.length,
    1: tasks.filter((t) => t.status === 1).length,
    2: tasks.filter((t) => t.status === 2).length,
    3: tasks.filter((t) => t.status === 3).length,
  };

  // ── Due date helpers ──
  const isDueToday = (d: string) => {
    const today = new Date().toISOString().split("T")[0];
    return d?.split("T")[0] === today;
  };
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  // ── Loading state ──
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 font-jakarta">
        <FiLoader className="text-3xl text-blue animate-spin mb-3" />
        <p className="text-sm text-slate animate-pulse">Loading tasks…</p>
      </div>
    );
  }

  // ── Error state ──
  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center py-32 font-jakarta text-center">
        <FiAlertCircle className="text-4xl text-red-400 mb-3" />
        <p className="text-sm text-slate mb-3">Failed to load tasks</p>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 text-sm font-semibold text-blue hover:text-bluelt transition-colors"
        >
          <FiRefreshCw className="text-sm" /> Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[1160px] mx-auto px-4 lg:px-8 py-8 font-jakarta text-navy animate-fadeUp">
      <p className="text-xs text-mist font-mono mb-6">
        Intern Portal <span className="text-blue">/ Tasks</span>
      </p>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-7 gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-navy tracking-tight mb-1">
            Task Manager
          </h1>
          <p className="text-sm text-slate">
            Create, track, and manage your daily tasks.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-blue hover:bg-bluelt text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors shadow-sm"
        >
          <FiPlus className="text-base" /> New Task
        </button>
      </div>

      {/* KPI Filter Tabs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
        {[
          {
            key: "all" as const,
            label: "All Tasks",
            color: "text-navy",
            bg: "bg-white",
            dot: "bg-navy",
          },
          { key: 1 as const, ...STATUS_CONFIG[1] },
          { key: 2 as const, ...STATUS_CONFIG[2] },
          { key: 3 as const, ...STATUS_CONFIG[3] },
        ].map((tab) => {
          const isActive = filter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`text-left border rounded-xl p-4 transition-all ${
                isActive
                  ? "border-blue ring-2 ring-blue/20 bg-sky/40"
                  : "border-line bg-white hover:border-blue/30"
              }`}
            >
              <p className="text-2xl font-extrabold">{counts[tab.key]}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`w-2 h-2 rounded-full ${tab.dot}`} />
                <span className={`text-xs font-medium ${tab.color}`}>
                  {tab.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* ═══ Create Task Modal ═══ */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-fadeUp">
            <h2 className="text-lg font-extrabold text-navy mb-5">
              Create New Task
            </h2>
            <Formik
              initialValues={{
                newTitle: "",
                description: "",
                dueDate: "",
                dueTime: "",
                status: "not-started",
                owner: user ? user.user_id : "",
                priority: "normal",
              }}
              validationSchema={Yup.object({
                newTitle: Yup.string().required("Task title is required"),
                dueDate: Yup.string().required("Due date is required"),
                dueTime: Yup.string().required("Due time is required"),
                owner: Yup.string().required("Task owner is required"),
                priority: Yup.string().required("Priority is required"),
              })}
              onSubmit={addTask}
            >
              {({ isSubmitting, resetForm }) => (
                <Form>
                  <label className="block text-xs font-bold text-slate mb-1.5">
                    Task Title *
                  </label>
                  <Field
                    as="select"
                    name="newTitle"
                    className="h-10 border border-gray-200 rounded-md px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue/30 mb-1 w-full"
                  >
                    <option value="">Select task title</option>
                    {titleArray.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.option}
                      </option>
                    ))}
                  </Field>
                  <ErrorMessage
                    name="newTitle"
                    component="div"
                    className="text-xs text-red-500 mb-2"
                  />

                  <label className="block text-xs font-bold text-slate mb-1.5">
                    Descreption
                  </label>
                  <Field
                    as="textarea"
                    name="description"
                    placeholder="add any extranotes"
                    className="w-full h-10 border border-gray-200 rounded-md px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue/30 mb-1"
                  />
                  <ErrorMessage
                    name="description"
                    component="div"
                    className="text-xs text-red-500 mb-2"
                  />

                  <label className="block text-xs font-bold text-slate mb-1.5">
                    Due Date *
                  </label>
                  <div className="relative mb-1">
                    <FiCalendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mist text-sm pointer-events-none" />
                    <Field
                      type="date"
                      name="dueDate"
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full border border-line rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue/30"
                    />
                  </div>
                  <ErrorMessage
                    name="dueDate"
                    component="div"
                    className="text-xs text-red-500 mb-2"
                  />

                  <label className="block text-xs font-bold text-slate mb-1.5">
                    Due Time *
                  </label>
                  <div className="relative mb-1">
                    <Field
                      type="time"
                      step="1"
                      name="dueTime"
                      className="w-full border border-line rounded-lg pl-10 pr-4 py-2.5 text-sm"
                    />
                  </div>
                  <ErrorMessage
                    name="dueTime"
                    component="div"
                    className="text-xs text-red-500 mb-2"
                  />

                  <label className="block text-xs font-bold text-slate mb-1.5">
                    Status
                  </label>
                  <div className="relative mb-1">
                    <Field
                      as="select"
                      name="status"
                      className="w-full border border-line rounded-lg pl-4 pr-4 py-2.5 text-sm"
                    >
                      <option value="not-started">Not Started</option>
                      <option value="inprogress">Inprogress</option>
                      <option value="completed">Completed</option>
                    </Field>
                  </div>
                  <ErrorMessage
                    name="status"
                    component="div"
                    className="text-xs text-red-500 mb-2"
                  />

                  <label className="block text-xs font-bold text-slate mb-1.5">
                    Task Owner
                  </label>
                  <div className="relative mb-1">
                    <Field
                      as="select"
                      name="owner"
                      className="w-full border border-line rounded-lg pl-4 pr-4 py-2.5 text-sm"
                    >
                      <option value="">Select owner</option>
                      {user && (
                        <option value={user.user_id}>
                          {user.username} (You)
                        </option>
                      )}
                      {mentors.map((mentor) => (
                        <option key={mentor.user_id} value={mentor.user_id}>
                          {mentor.username}
                        </option>
                      ))}
                    </Field>
                  </div>
                  <ErrorMessage
                    name="owner"
                    component="div"
                    className="text-xs text-red-500 mb-2"
                  />

                  <label className="block text-xs font-bold text-slate mb-1.5">
                    Priority
                  </label>
                  <div className="relative mb-5">
                    <Field
                      as="select"
                      name="priority"
                      className="w-full border border-line rounded-lg pl-4 pr-4 py-2.5 text-sm"
                    >
                      <option value="high">High</option>

                      <option value="normal">Normal</option>
                      <option value="low">Low</option>
                    </Field>
                  </div>
                  <ErrorMessage
                    name="priority"
                    component="div"
                    className="text-xs text-red-500 mb-2"
                  />

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreate(false);
                        resetForm();
                      }}
                      className="text-sm font-semibold text-slate px-5 py-2.5 rounded-lg border border-line hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || creating}
                      className="text-sm font-semibold text-white bg-blue hover:bg-bluelt disabled:opacity-40 px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2"
                    >
                      {(isSubmitting || creating) && (
                        <FiLoader className="animate-spin text-sm" />
                      )}
                      {isSubmitting || creating ? "Creating…" : "Create Task"}
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      )}

      {/* ═══ Pause Reason Modal ═══ */}
      {pauseTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fadeUp">
            <h2 className="text-lg font-extrabold text-navy mb-1">
              Pause Task
            </h2>
            <p className="text-xs text-mist mb-4 truncate">
              {pauseTarget.title}
            </p>

            <label className="block text-xs font-bold text-slate mb-1.5">
              Reason *
            </label>
            <textarea
              value={pauseReason}
              onChange={(e) => setPauseReason(e.target.value)}
              placeholder="Why are you pausing this task?"
              rows={3}
              maxLength={500}
              className="w-full border border-line rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue/30 mb-5 resize-none"
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setPauseTarget(null);
                  setPauseReason("");
                }}
                className="text-sm font-semibold text-slate px-5 py-2.5 rounded-lg border border-line hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmPause}
                disabled={!pauseReason.trim() || pausing}
                className="text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-40 px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2"
              >
                {pausing && <FiLoader className="animate-spin text-sm" />}
                {pausing ? "Pausing…" : "OK"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Edit Task Modal ═══ */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-fadeUp">
            <h2 className="text-lg font-extrabold text-navy mb-5">Edit Task</h2>
            <Formik
              initialValues={{
                editTitle: editTarget.title || "",
                description: editTarget.description || "",
                dueDate: editTarget.due_time ? editTarget.due_time.split("T")[0] : "",
                dueTime: editTarget.due_time ? (editTarget.due_time.split(" ")[1] || "") : "",
                owner: editTarget.created_by || user?.user_id || "",
                priority: editTarget.priority ? String(editTarget.priority) : "normal",
              }}
              enableReinitialize
              validationSchema={Yup.object({
                editTitle: Yup.string().required("Task title is required"),
                dueDate: Yup.string().required("Due date is required"),
                dueTime: Yup.string().required("Due time is required"),
                owner: Yup.string().required("Task owner is required"),
                priority: Yup.string().required("Priority is required"),
              })}
              onSubmit={async (values, { setSubmitting }) => {
                setUpdating(true);
                try {
                  const dueDateTime = `${values.dueDate} ${values.dueTime}`;
                  const payload: any = {};
                  if (values.editTitle.trim() !== editTarget.title) payload.title = values.editTitle.trim();
                  if (dueDateTime !== editTarget.due_time) payload.due_time = dueDateTime;
                  if (values.description !== editTarget.description) payload.description = values.description;
                  if (values.owner !== String(editTarget.created_by)) payload.created_by = values.owner;
                  if (values.priority !== String(editTarget.priority)) payload.priority = values.priority;
                  if (Object.keys(payload).length === 0) {
                    setEditTarget(null);
                    setUpdating(false);
                    setSubmitting(false);
                    return;
                  }
                  await updateTaskApi(editTarget.task_id, payload);
                  toast.success("Task updated");
                  setEditTarget(null);
                  await refreshTasks();
                } catch (err: any) {
                  const detail = err?.response?.data?.detail;
                  const msg = Array.isArray(detail)
                    ? detail.map((d: any) => d.msg).join(", ")
                    : detail || "Failed to update task";
                  toast.error(msg);
                } finally {
                  setUpdating(false);
                  setSubmitting(false);
                }
              }}
            >
              {({ isSubmitting, resetForm, values, setFieldValue }) => (
                <Form>
                  <label className="block text-xs font-bold text-slate mb-1.5">Task Title *</label>
                  <Field name="editTitle" as="select" className="h-10 border border-gray-200 rounded-md px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue/30 mb-1 w-full">
                    <option value="">Select task title</option>
                    {titleArray.map((t) => (
                      <option key={t.value} value={t.value}>{t.option}</option>
                    ))}
                  </Field>
                  <ErrorMessage name="editTitle" component="div" className="text-xs text-red-500 mb-2" />

                  <label className="block text-xs font-bold text-slate mb-1.5">Description</label>
                  <Field as="textarea" name="description" placeholder="add any extranotes" className="w-full h-10 border border-gray-200 rounded-md px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue/30 mb-1" />
                  <ErrorMessage name="description" component="div" className="text-xs text-red-500 mb-2" />

                  <label className="block text-xs font-bold text-slate mb-1.5">Due Date *</label>
                  <div className="relative mb-1">
                    <FiCalendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mist text-sm pointer-events-none" />
                    <Field
                      type="date"
                      name="dueDate"
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full border border-line rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue/30"
                    />
                  </div>
                  <ErrorMessage name="dueDate" component="div" className="text-xs text-red-500 mb-2" />

                  <label className="block text-xs font-bold text-slate mb-1.5">Due Time *</label>
                  <div className="relative mb-1">
                    <Field
                      type="time"
                      step="1"
                      name="dueTime"
                      className="w-full border border-line rounded-lg pl-10 pr-4 py-2.5 text-sm"
                    />
                  </div>
                  <ErrorMessage name="dueTime" component="div" className="text-xs text-red-500 mb-2" />

                  <label className="block text-xs font-bold text-slate mb-1.5">Task Owner</label>
                  <div className="relative mb-1">
                    <Field as="select" name="owner" className="w-full border border-line rounded-lg pl-4 pr-4 py-2.5 text-sm">
                      <option value="">Select owner</option>
                      {user && (
                        <option value={user.user_id}>{user.username} (You)</option>
                      )}
                      {mentors.map((mentor) => (
                        <option key={mentor.user_id} value={mentor.user_id}>{mentor.username}</option>
                      ))}
                    </Field>
                  </div>
                  <ErrorMessage name="owner" component="div" className="text-xs text-red-500 mb-2" />

                  <label className="block text-xs font-bold text-slate mb-1.5">Priority</label>
                  <div className="relative mb-5">
                    <Field as="select" name="priority" className="w-full border border-line rounded-lg pl-4 pr-4 py-2.5 text-sm">
                      <option value="high">High</option>
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                    </Field>
                  </div>
                  <ErrorMessage name="priority" component="div" className="text-xs text-red-500 mb-2" />

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setEditTarget(null);
                        resetForm();
                      }}
                      className="text-sm font-semibold text-slate px-5 py-2.5 rounded-lg border border-line hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || updating}
                      className="text-sm font-semibold text-white bg-blue hover:bg-bluelt disabled:opacity-40 px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2"
                    >
                      {(isSubmitting || updating) && <FiLoader className="animate-spin text-sm" />}
                      {(isSubmitting || updating) ? "Updating…" : "Update Task"}
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      )}

      {/* ═══ Tasks List ═══ */}
      <div className="bg-white border border-line rounded-[13px] overflow-hidden">
        <div className="px-5 py-4 border-b border-line flex items-center justify-between">
          <span className="text-sm font-extrabold text-navy">
            {filter === "all"
              ? "All Tasks"
              : (STATUS_CONFIG[filter]?.label ?? "Tasks")}{" "}
            ({filtered.length})
          </span>
          <button
            onClick={refreshTasks}
            className="p-2 text-slate hover:text-blue hover:bg-sky rounded-lg transition-colors"
            title="Refresh"
          >
            <FiRefreshCw className="text-sm" />
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FiCircle className="text-4xl text-line mb-3" />
            <p className="text-sm text-mist">No tasks found.</p>
            <p className="text-xs text-mist mt-1">
              Click "New Task" to create one.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-line">
            {filtered.map((task) => {
              const cfg = getStatusCfg(task.status);
              const overdue = task.is_overdue;
              const dueToday = isDueToday(task.due_time);
              const busy = actionLoading === task.task_id;

              return (
                <div
                  key={task.task_id}
                  className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-lightbg/50 transition-colors"
                >
                  {/* Left: Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`}
                      />
                      <span className="text-sm font-bold text-navy truncate">
                        {task.title}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-1.5 pl-[18px]">
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}
                      >
                        {cfg.label}
                      </span>

                      <span
                        className={`flex items-center gap-1 text-[11px] ${
                          overdue
                            ? "text-red-500 font-bold"
                            : dueToday
                              ? "text-amber-600 font-semibold"
                              : "text-mist"
                        }`}
                      >
                        <FiCalendar className="text-xs" />
                        {overdue ? "Overdue · " : dueToday ? "Today · " : ""}
                        {formatDate(task.due_time)}
                      </span>

                      <span className="text-[11px] text-mist">
                        by {task.created_by}
                      </span>

                      {task.status === 1 && (
                        <button
                          onClick={() => openEditModal(task)}
                          className="flex items-center gap-1 text-[11px] font-semibold text-blue hover:text-bluelt transition-colors"
                        >
                          <FiEdit2 className="text-xs" /> Edit
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Right: Action buttons */}
                  <div className="flex items-center gap-2 sm:flex-shrink-0">
                    {/* View Task */}
                    <button
                      title="View Task"
                      onClick={() => handleViewTask(task.task_id)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-blue bg-sky/40 hover:bg-sky px-2.5 py-2 rounded-lg transition-colors"
                    >
                      <FiEye className="text-base" />
                    </button>
                          {/* ═══ View Task Modal ═══ */}
                          {viewTask && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
                              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fadeUp">
                                <h2 className="text-lg font-extrabold text-navy mb-3 flex items-center gap-2">
                                  <FiEye className="text-blue" /> Task Details
                                </h2>
                                <>
                                  <div className="mb-3">
                                    <div className="text-xs text-mist mb-1">Title</div>
                                    <div className="font-bold text-navy">{viewTask.title}</div>
                                  </div>
                                  <div className="mb-3">
                                    <div className="text-xs text-mist mb-1">Description</div>
                                    <div className="text-slate text-sm">{viewTask.description || "-"}</div>
                                  </div>
                                  <div className="mb-3">
                                    <div className="text-xs text-mist mb-1">Due Date</div>
                                    <div className="text-slate text-sm">{viewTask.due_time ? formatDate(viewTask.due_time) : "-"}</div>
                                  </div>
                                  <div className="mb-3">
                                    <div className="text-xs text-mist mb-1">Status</div>
                                    <div className="text-slate text-sm">{getStatusCfg(viewTask.status).label}</div>
                                  </div>
                                  <div className="mb-3">
                                    <div className="text-xs text-mist mb-1">Owner</div>
                                    <div className="text-slate text-sm">{viewTask.created_by}</div>
                                  </div>
                                  <div className="mb-3">
                                    <div className="text-xs text-mist mb-1">Priority</div>
                                    <div className="text-slate text-sm">{viewTask.priority || "-"}</div>
                                  </div>
                                </>
                                <div className="flex justify-end mt-4">
                                  <button
                                    onClick={() => setViewTask(null)}
                                    className="text-sm font-semibold text-slate px-5 py-2.5 rounded-lg border border-line hover:bg-gray-50 transition-colors"
                                  >
                                    Close
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                    {/* Status 1 = To Do → Start */}
                    {task.status === 1 && (
                      <button
                        onClick={() => handleStart(task)}
                        disabled={busy}
                        className="flex items-center gap-1.5 text-xs font-semibold text-white bg-blue hover:bg-bluelt disabled:opacity-50 px-3.5 py-2 rounded-lg transition-colors"
                      >
                        {busy ? (
                          <FiLoader className="animate-spin text-sm" />
                        ) : (
                          <FiPlay className="text-sm" />
                        )}
                        Start
                      </button>
                    )}

                    {/* Status 2 = In Progress → Pause + End */}
                    {/* In Progress */}
                    {task.status === 2 && (
                      <>
                        <button
                          onClick={() => openPauseModal(task)}
                          disabled={busy}
                          className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3.5 py-2 rounded-lg"
                        >
                          {busy ? (
                            <FiLoader className="animate-spin text-sm" />
                          ) : (
                            <FiPause className="text-sm" />
                          )}
                          Pause
                        </button>

                        <button
                          onClick={() => handleEnd(task)}
                          disabled={busy}
                          className="flex items-center gap-1.5 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 px-3.5 py-2 rounded-lg"
                        >
                          {busy ? (
                            <FiLoader className="animate-spin text-sm" />
                          ) : (
                            <FiSquare className="text-sm" />
                          )}
                          End
                        </button>
                      </>
                    )}

                    {/* Paused */}
                    {task.status === 4 && (
                      <>
                        <button
                          onClick={() => handleResume(task)}
                          disabled={busy}
                          className="flex items-center gap-1.5 text-xs font-semibold text-white bg-blue hover:bg-bluelt px-3.5 py-2 rounded-lg"
                        >
                          {busy ? (
                            <FiLoader className="animate-spin text-sm" />
                          ) : (
                            <FiPlay className="text-sm" />
                          )}
                          Resume
                        </button>

                        <button
                          onClick={() => handleEnd(task)}
                          disabled={busy}
                          className="flex items-center gap-1.5 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 px-3.5 py-2 rounded-lg"
                        >
                          {busy ? (
                            <FiLoader className="animate-spin text-sm" />
                          ) : (
                            <FiSquare className="text-sm" />
                          )}
                          End
                        </button>
                      </>
                    )}

                    {/* Status 3 = Completed */}
                    {task.status === 3 && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-green-600">
                        <FiCheckCircle /> Done
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TasksPage;
