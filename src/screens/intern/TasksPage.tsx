import { useState, useEffect, useRef, useCallback } from "react";
import { FiPlus, FiPlay, FiPause, FiSquare, FiClock, FiCheckCircle, FiCircle, FiTrash2, FiEye } from "react-icons/fi";

// ── Types ──────────────────────────────────────────
type TaskStatus = "not-started" | "in-progress" | "paused" | "completed";

interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  createdAt: number;
  startedAt: number | null;
  completedAt: number | null;
  elapsedSeconds: number;       // accumulated time
  lastResumedAt: number | null;  // timestamp when last resumed/started
}

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; bg: string; dot: string }> = {
  "not-started": { label: "Not Started", color: "text-mist",  bg: "bg-gray-100",  dot: "bg-gray-400" },
  "in-progress": { label: "In Progress", color: "text-blue",  bg: "bg-sky",       dot: "bg-blue" },
  paused:        { label: "Paused",      color: "text-amber-600", bg: "bg-amber-50", dot: "bg-amber-500" },
  completed:     { label: "Completed",   color: "text-green-600", bg: "bg-green-50", dot: "bg-green-500" },
};

const generateId = () => `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

// ── Helpers ────────────────────────────────────────
const formatDuration = (totalSeconds: number) => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

const STORAGE_KEY = "intern_tasks";

const loadTasks = (): Task[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveTasks = (tasks: Task[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
};

// ── Component ──────────────────────────────────────
const TasksPage = () => {
  const [tasks, setTasks] = useState<Task[]>(loadTasks);
  const [showCreate, setShowCreate] = useState(false);
  const [viewTask, setViewTask] = useState<Task | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [filter, setFilter] = useState<"all" | TaskStatus>("all");
  const [, setTick] = useState(0);       // forces re-render for live timer
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // persist on change
  useEffect(() => { saveTasks(tasks); }, [tasks]);

  // live timer tick every second if any task is in-progress
  useEffect(() => {
    const hasRunning = tasks.some((t) => t.status === "in-progress");
    if (hasRunning && !tickRef.current) {
      tickRef.current = setInterval(() => setTick((n) => n + 1), 1000);
    } else if (!hasRunning && tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [tasks]);

  // ── Live elapsed ──
  const liveElapsed = useCallback((task: Task) => {
    if (task.status !== "in-progress" || !task.lastResumedAt) return task.elapsedSeconds;
    return task.elapsedSeconds + Math.floor((Date.now() - task.lastResumedAt) / 1000);
  }, []);

  // ── Actions ──
  const addTask = () => {
    if (!newTitle.trim()) return;
    const task: Task = {
      id: generateId(),
      title: newTitle.trim(),
      description: newDesc.trim(),
      status: "not-started",
      createdAt: Date.now(),
      startedAt: null,
      completedAt: null,
      elapsedSeconds: 0,
      lastResumedAt: null,
    };
    setTasks((prev) => [task, ...prev]);
    setNewTitle("");
    setNewDesc("");
    setShowCreate(false);
  };

  const startTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: "in-progress" as const, startedAt: t.startedAt ?? Date.now(), lastResumedAt: Date.now() }
          : t
      )
    );
  };

  const pauseTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id || t.status !== "in-progress") return t;
        const additional = t.lastResumedAt ? Math.floor((Date.now() - t.lastResumedAt) / 1000) : 0;
        return { ...t, status: "paused" as const, elapsedSeconds: t.elapsedSeconds + additional, lastResumedAt: null };
      })
    );
  };

  const endTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const additional = t.status === "in-progress" && t.lastResumedAt
          ? Math.floor((Date.now() - t.lastResumedAt) / 1000) : 0;
        return { ...t, status: "completed" as const, elapsedSeconds: t.elapsedSeconds + additional, lastResumedAt: null, completedAt: Date.now() };
      })
    );
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (viewTask?.id === id) setViewTask(null);
  };

  // ── Filtered ──
  const filtered = filter === "all" ? tasks : tasks.filter((t) => t.status === filter);

  const counts = {
    all: tasks.length,
    "not-started": tasks.filter((t) => t.status === "not-started").length,
    "in-progress": tasks.filter((t) => t.status === "in-progress").length,
    paused: tasks.filter((t) => t.status === "paused").length,
    completed: tasks.filter((t) => t.status === "completed").length,
  };

  // ── Render ───────────────────────────────────────
  return (
    <div className="max-w-[1160px] mx-auto px-4 lg:px-8 py-8 font-jakarta text-navy animate-fadeUp">
      <p className="text-xs text-mist font-mono mb-6">
        Intern Portal <span className="text-blue">/ Tasks</span>
      </p>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-7 gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-navy tracking-tight mb-1">Task Manager</h1>
          <p className="text-sm text-slate">Create, track, and manage your daily tasks.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-blue hover:bg-bluelt text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors shadow-sm"
        >
          <FiPlus className="text-base" /> New Task
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4 mb-6">
        {(["all", "not-started", "in-progress", "paused", "completed"] as const).map((key) => {
          const isActive = filter === key;
          const cfg = key === "all" ? { label: "All Tasks", color: "text-navy", bg: "bg-white", dot: "bg-navy" } : STATUS_CONFIG[key];
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`text-left border rounded-xl p-4 transition-all ${
                isActive ? "border-blue ring-2 ring-blue/20 bg-sky/40" : "border-line bg-white hover:border-blue/30"
              }`}
            >
              <p className="text-2xl font-extrabold">{counts[key]}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-fadeUp">
            <h2 className="text-lg font-extrabold text-navy mb-4">Create New Task</h2>

            <label className="block text-xs font-bold text-slate mb-1.5">Task Title *</label>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Build login page"
              maxLength={120}
              className="w-full border border-line rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue/30 mb-4"
            />

            <label className="block text-xs font-bold text-slate mb-1.5">Description</label>
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Describe what needs to be done…"
              rows={3}
              maxLength={500}
              className="w-full border border-line rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue/30 mb-5 resize-none"
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setShowCreate(false); setNewTitle(""); setNewDesc(""); }}
                className="text-sm font-semibold text-slate px-5 py-2.5 rounded-lg border border-line hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addTask}
                disabled={!newTitle.trim()}
                className="text-sm font-semibold text-white bg-blue hover:bg-bluelt disabled:opacity-40 px-5 py-2.5 rounded-lg transition-colors"
              >
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Task Detail Modal */}
      {viewTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-fadeUp">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-lg font-extrabold text-navy">{viewTask.title}</h2>
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${STATUS_CONFIG[viewTask.status].bg} ${STATUS_CONFIG[viewTask.status].color}`}>
                {STATUS_CONFIG[viewTask.status].label}
              </span>
            </div>

            {viewTask.description && (
              <p className="text-sm text-slate mb-4 leading-relaxed">{viewTask.description}</p>
            )}

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-lightbg rounded-lg p-3">
                <p className="text-[11px] text-mist font-bold mb-0.5">Created</p>
                <p className="text-sm font-semibold">{new Date(viewTask.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</p>
              </div>
              <div className="bg-lightbg rounded-lg p-3">
                <p className="text-[11px] text-mist font-bold mb-0.5">Time Spent</p>
                <p className="text-sm font-semibold">{formatDuration(liveElapsed(viewTask))}</p>
              </div>
              {viewTask.startedAt && (
                <div className="bg-lightbg rounded-lg p-3">
                  <p className="text-[11px] text-mist font-bold mb-0.5">Started</p>
                  <p className="text-sm font-semibold">{new Date(viewTask.startedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</p>
                </div>
              )}
              {viewTask.completedAt && (
                <div className="bg-lightbg rounded-lg p-3">
                  <p className="text-[11px] text-mist font-bold mb-0.5">Completed</p>
                  <p className="text-sm font-semibold">{new Date(viewTask.completedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end">
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

      {/* Tasks List */}
      <div className="bg-white border border-line rounded-[13px] overflow-hidden">
        <div className="px-5 py-4 border-b border-line flex items-center justify-between">
          <span className="text-sm font-extrabold text-navy">
            {filter === "all" ? "All Tasks" : STATUS_CONFIG[filter].label} ({filtered.length})
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FiCircle className="text-4xl text-line mb-3" />
            <p className="text-sm text-mist">No tasks found.</p>
            <p className="text-xs text-mist mt-1">Click "New Task" to create one.</p>
          </div>
        ) : (
          <div className="divide-y divide-line">
            {filtered.map((task) => {
              const cfg = STATUS_CONFIG[task.status];
              const elapsed = liveElapsed(task);
              return (
                <div key={task.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-lightbg/50 transition-colors">
                  {/* Left: Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                      <span className="text-sm font-bold text-navy truncate">{task.title}</span>
                    </div>
                    {task.description && (
                      <p className="text-xs text-slate truncate pl-[18px]">{task.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-1.5 pl-[18px]">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                        {cfg.label}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-mist">
                        <FiClock className="text-xs" /> {formatDuration(elapsed)}
                      </span>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 sm:flex-shrink-0">
                    {task.status === "not-started" && (
                      <button
                        onClick={() => startTask(task.id)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-white bg-blue hover:bg-bluelt px-3.5 py-2 rounded-lg transition-colors"
                      >
                        <FiPlay className="text-sm" /> Start
                      </button>
                    )}

                    {task.status === "in-progress" && (
                      <>
                        <button
                          onClick={() => pauseTask(task.id)}
                          className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3.5 py-2 rounded-lg transition-colors"
                        >
                          <FiPause className="text-sm" /> Pause
                        </button>
                        <button
                          onClick={() => endTask(task.id)}
                          className="flex items-center gap-1.5 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 px-3.5 py-2 rounded-lg transition-colors"
                        >
                          <FiSquare className="text-sm" /> End Task
                        </button>
                      </>
                    )}

                    {task.status === "paused" && (
                      <>
                        <button
                          onClick={() => startTask(task.id)}
                          className="flex items-center gap-1.5 text-xs font-semibold text-white bg-blue hover:bg-bluelt px-3.5 py-2 rounded-lg transition-colors"
                        >
                          <FiPlay className="text-sm" /> Resume
                        </button>
                        <button
                          onClick={() => endTask(task.id)}
                          className="flex items-center gap-1.5 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 px-3.5 py-2 rounded-lg transition-colors"
                        >
                          <FiSquare className="text-sm" /> End Task
                        </button>
                      </>
                    )}

                    {task.status === "completed" && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-green-600">
                        <FiCheckCircle /> Done
                      </span>
                    )}

                    {/* View & Delete — always visible */}
                    <button
                      onClick={() => setViewTask(task)}
                      className="p-2 text-slate hover:text-blue rounded-lg hover:bg-sky transition-colors"
                      title="View Details"
                    >
                      <FiEye className="text-sm" />
                    </button>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-2 text-slate hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                      title="Delete Task"
                    >
                      <FiTrash2 className="text-sm" />
                    </button>
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
