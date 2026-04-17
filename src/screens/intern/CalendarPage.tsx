import { useState, useEffect, useMemo, useCallback } from "react";
import { FiChevronLeft, FiChevronRight, FiCircle, FiClock, FiCheckCircle, FiLoader, FiAlertCircle, FiRefreshCw } from "react-icons/fi";
import { getTasksApi } from "../../services/internApi";

// ── Types ──────────────────────────────────────────
interface Task {
  task_id: number;
  user_id: number;
  title: string;
  status: number; // 1=To Do, 2=In Progress, 3=Completed
  start_time: string | null;
  completion_time: string | null;
  created_at: string;
  created_by: string;
  updated_at: string;
  due_time: string;
  is_editable: boolean;
  is_overdue: boolean;
}

const STATUS_COLORS: Record<number, { dot: string; bg: string; text: string; label: string }> = {
  1: { dot: "bg-amber-500",  bg: "bg-amber-50",  text: "text-amber-600", label: "To Do" },
  2: { dot: "bg-blue",       bg: "bg-sky",        text: "text-blue",      label: "In Progress" },
  3: { dot: "bg-green-500",  bg: "bg-green-50",   text: "text-green-600", label: "Completed" },
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ── Helpers ────────────────────────────────────────
const toDateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

// ── Component ──────────────────────────────────────
const CalendarPage = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(toDateKey(today));

  // ── Fetch tasks from API ──
  const fetchTasks = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const res = await getTasksApi();
      setTasks(Array.isArray(res.data) ? res.data : []);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Map date → tasks (by due_time date)
  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    tasks.forEach((t) => {
      if (!t.due_time) return;
      const key = t.due_time.split("T")[0];
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return map;
  }, [tasks]);

  // Calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const cells: { date: number; month: "prev" | "current" | "next"; key: string }[] = [];

    // Previous month filler
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const m = viewMonth === 0 ? 11 : viewMonth - 1;
      const y = viewMonth === 0 ? viewYear - 1 : viewYear;
      cells.push({ date: d, month: "prev", key: `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}` });
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ date: d, month: "current", key: `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}` });
    }

    // Next month filler
    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
      const m = viewMonth === 11 ? 0 : viewMonth + 1;
      const y = viewMonth === 11 ? viewYear + 1 : viewYear;
      cells.push({ date: d, month: "next", key: `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}` });
    }

    return cells;
  }, [viewYear, viewMonth]);

  const todayKey = toDateKey(today);

  const goToPrev = useCallback(() => {
    setViewMonth((m) => {
      if (m === 0) { setViewYear((y) => y - 1); return 11; }
      return m - 1;
    });
  }, []);

  const goToNext = useCallback(() => {
    setViewMonth((m) => {
      if (m === 11) { setViewYear((y) => y + 1); return 0; }
      return m + 1;
    });
  }, []);

  const goToToday = useCallback(() => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelectedDate(todayKey);
  }, [todayKey, today]);

  const selectedTasks = selectedDate ? (tasksByDate[selectedDate] ?? []) : [];

  // ── Loading state ──
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 font-jakarta">
        <FiLoader className="text-3xl text-blue animate-spin mb-3" />
        <p className="text-sm text-slate animate-pulse">Loading calendar…</p>
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
          onClick={fetchTasks}
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
        Intern Portal <span className="text-blue">/ Calendar</span>
      </p>

      <div className="mb-7">
        <h1 className="text-2xl font-extrabold text-navy tracking-tight mb-1">Task Calendar</h1>
        <p className="text-sm text-slate">View your tasks on the calendar. Dates with tasks are highlighted.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        {/* Calendar */}
        <div className="bg-white border border-line rounded-[13px] overflow-hidden">
          {/* Month nav */}
          <div className="px-5 py-4 border-b border-line flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={goToPrev} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <FiChevronLeft className="text-lg" />
              </button>
              <h2 className="text-sm font-extrabold text-navy min-w-[160px] text-center">
                {MONTHS[viewMonth]} {viewYear}
              </h2>
              <button onClick={goToNext} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <FiChevronRight className="text-lg" />
              </button>
            </div>
            <button
              onClick={goToToday}
              className="text-xs font-semibold text-blue hover:text-bluelt transition-colors"
            >
              Today
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-line">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center text-[11px] font-bold text-mist py-2.5">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {calendarDays.map((cell) => {
              const hasTasks = (tasksByDate[cell.key]?.length ?? 0) > 0;
              const isToday = cell.key === todayKey && cell.month === "current";
              const isSelected = cell.key === selectedDate;
              const isCurrentMonth = cell.month === "current";

              // Count by status
              const cellTasks = tasksByDate[cell.key] ?? [];
              const completedCount = cellTasks.filter((t) => t.status === 3).length;
              const inProgressCount = cellTasks.filter((t) => t.status === 2).length;
              const notStartedCount = cellTasks.filter((t) => t.status === 1).length;

              return (
                <button
                  key={cell.key + cell.month}
                  onClick={() => setSelectedDate(cell.key)}
                  className={`relative flex flex-col items-center py-2.5 min-h-[68px] border-b border-r border-line/50 transition-all
                    ${!isCurrentMonth ? "text-gray-300" : "text-navy"}
                    ${isSelected ? "bg-sky/50 ring-1 ring-blue/30" : "hover:bg-gray-50"}
                    ${isToday && !isSelected ? "bg-blue/5" : ""}
                  `}
                >
                  <span
                    className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full
                      ${isToday ? "bg-blue text-white" : ""}
                    `}
                  >
                    {cell.date}
                  </span>

                  {/* Task dots */}
                  {hasTasks && isCurrentMonth && (
                    <div className="flex items-center gap-0.5 mt-1.5">
                      {completedCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                      {inProgressCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-blue" />}
                      {notStartedCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />}
                    </div>
                  )}

                  {/* Task count badge */}
                  {hasTasks && isCurrentMonth && (
                    <span className="text-[9px] font-bold text-mist mt-0.5">
                      {cellTasks.length} task{cellTasks.length > 1 ? "s" : ""}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="px-5 py-3 border-t border-line flex flex-wrap gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-[11px] text-slate">Completed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue" />
              <span className="text-[11px] text-slate">In Progress</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-[11px] text-slate">To Do</span>
            </div>
          </div>
        </div>

        {/* Selected date detail panel */}
        <div className="bg-white border border-line rounded-[13px] overflow-hidden h-fit lg:sticky lg:top-[76px]">
          <div className="px-5 py-4 border-b border-line">
            <h3 className="text-sm font-extrabold text-navy">
              {selectedDate
                ? new Date(selectedDate + "T00:00:00").toLocaleDateString("en-IN", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "Select a date"}
            </h3>
            <p className="text-xs text-mist mt-0.5">
              {selectedTasks.length} task{selectedTasks.length !== 1 ? "s" : ""} on this day
            </p>
          </div>

          {selectedTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FiCircle className="text-3xl text-line mb-2" />
              <p className="text-sm text-mist">No tasks on this date.</p>
            </div>
          ) : (
            <div className="divide-y divide-line max-h-[480px] overflow-y-auto">
              {selectedTasks.map((task) => {
                const cfg = STATUS_COLORS[task.status] || { dot: "bg-gray-400", bg: "bg-gray-100", text: "text-mist", label: "Unknown" };
                return (
                  <div key={task.task_id} className="px-5 py-3.5">
                    <div className="flex items-start gap-2">
                      <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${cfg.dot}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-navy truncate">{task.title}</p>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                            {cfg.label}
                          </span>
                          {task.is_overdue && (
                            <span className="text-[10px] font-bold text-red-500">Overdue</span>
                          )}
                          {task.status === 3 && (
                            <span className="flex items-center gap-1 text-[10px] text-green-600">
                              <FiCheckCircle className="text-[10px]" /> Done
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-[10px] text-mist">
                            <FiClock className="text-[10px]" /> Due {formatDate(task.due_time)}
                          </span>
                        </div>
                        <span className="text-[10px] text-mist mt-1 block">by {task.created_by}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
