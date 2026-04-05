import { useEffect, useMemo, useState } from "react";
import { Button } from "antd";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import AdminPortalShell from "../../components/layout/AdminPortalShell";
import { getBatchesApi, getUserByBatchApi } from "../../services/authApi";
import { deleteUser, getAllUsers } from "../../services/adminApi";

interface BatchOption {
  id: number;
  label: string;
}

interface MentorUser {
  id: number;
  username: string;
  email: string;
  techStack: string;
}

const PAGE_SIZE = 10;

const toArray = (value: unknown) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const normalizeBatches = (payload: unknown): BatchOption[] => {
  return toArray(payload).map((item, index) => {
    if (typeof item === "object" && item !== null) {
      const batch = item as Record<string, unknown>;
      const rawId = Number(
        batch.id ?? batch.batch_id ?? batch.value ?? index + 1,
      );
      const rawLabel =
        batch.name ??
        batch.batch_name ??
        batch.label ??
        batch.title ??
        `Batch ${rawId}`;

      return {
        id: rawId,
        label: String(rawLabel),
      };
    }

    const rawId = Number(item);
    return {
      id: Number.isFinite(rawId) ? rawId : index + 1,
      label: `Batch ${String(item)}`,
    };
  });
};

const isMentorRecord = (user: Record<string, unknown>) => {
  const rawValues = [
    user.tech_stack,
    user.techStack,
    user.role,
    user.role_type,
    user.user_role,
    user.designation,
    user.user_type_name,
    user.type_name,
  ];

  return rawValues.some((value) =>
    String(value ?? "")
      .toLowerCase()
      .includes("mentor"),
  );
};

const normalizeMentors = (
  payload: unknown,
): MentorUser[] => {
  return toArray(payload)
    .map((item) => {
      if (typeof item !== "object" || item === null) return null;

      const user = item as Record<string, unknown>;
      const rawId = Number(user.id ?? user.user_id);
      const username = String(user.username ?? user.name ?? "").trim();

      if (!Number.isFinite(rawId) || !username || !isMentorRecord(user)) {
        return null;
      }

      return {
        id: rawId,
        username,
        email: String(user.email ?? "-"),
        techStack: String(user.tech_stack ?? user.domain ?? user.role ?? "-"),
      };
    })
    .filter((user): user is MentorUser => Boolean(user));
};

const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0">
    <path
      d="M1.5 12s3.82-6.5 10.5-6.5S22.5 12 22.5 12s-3.82 6.5-10.5 6.5S1.5 12 1.5 12Z"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="3.25" stroke="currentColor" strokeWidth="1.7" />
  </svg>
);

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DeleteIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0">
    <path d="M4 7h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M10 11v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M14 11v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M6 7l1 11a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const AdminMentorDashboard = () => {
  const navigate = useNavigate();
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState("all");
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [loadingMentors, setLoadingMentors] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
  const [mentors, setMentors] = useState<MentorUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<MentorUser | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMentors, setTotalMentors] = useState(0);

  useEffect(() => {
    const loadBatches = async () => {
      try {
        setLoadingBatches(true);
        const response = await getBatchesApi();
        const payload =
          response?.data?.data ?? response?.data?.batches ?? response?.data;
        setBatches(normalizeBatches(payload));
      } catch (error: any) {
        console.error(error);
        toast.error(error?.response?.data?.detail || "Failed to load batches");
      } finally {
        setLoadingBatches(false);
      }
    };

    void loadBatches();
  }, []);

  useEffect(() => {
    const loadMentors = async () => {
      try {
        setLoadingMentors(true);
        setSelectedUser(null);

        if (selectedBatchId === "all") {
          const response = await getAllUsers({
            page_no: page,
            page_size: PAGE_SIZE,
          });
          const payload = response?.data ?? {};
          const list = payload.data ?? payload.users ?? payload.items ?? [];
          const normalized = normalizeMentors(list);

          setMentors(normalized);
          setTotalPages(Number(payload.total_pages ?? 1));
          setTotalMentors(Number(payload.total_count ?? payload.total ?? normalized.length));
          return;
        }

        const response = await getUserByBatchApi(selectedBatchId);
        const payload =
          response?.data?.data ?? response?.data?.users ?? response?.data;
        const normalized = normalizeMentors(payload);

        setMentors(normalized);
        setTotalPages(1);
        setTotalMentors(normalized.length);
      } catch (error: any) {
        console.error(error);
        toast.error(error?.response?.data?.detail || "Failed to load mentors");
      } finally {
        setLoadingMentors(false);
      }
    };

    void loadMentors();
  }, [batches, page, selectedBatchId]);

  const selectedBatchLabel =
    selectedBatchId === "all"
      ? "All Batches"
      : batches.find((batch) => String(batch.id) === selectedBatchId)?.label ??
        `Batch ${selectedBatchId}`;

  const stats = useMemo(
    () => [
      {
        label: "Visible Mentors",
        value: String(mentors.length),
        hint:
          selectedBatchId === "all"
            ? `${selectedBatchLabel} - page ${page}`
            : selectedBatchLabel,
        valueClass: "text-white",
      },
      {
        label: "Total Mentors",
        value: String(totalMentors),
        hint: "Current filter count",
        valueClass: "text-blue-300",
      },
    ],
    [mentors.length, page, selectedBatchId, selectedBatchLabel, totalMentors],
  );

  const handleDeleteUser = async (user: MentorUser) => {
    if (deletingUserId !== null) return;

    const shouldDelete = window.confirm(`Delete mentor ${user.username} (#${user.id})?`);
    if (!shouldDelete) return;

    try {
      setDeletingUserId(user.id);
      await deleteUser(user.id);
      toast.success("Mentor deleted successfully");

      if (selectedBatchId === "all") {
        const isLastItemOnPage = mentors.length === 1 && page > 1;
        if (isLastItemOnPage) {
          setPage((currentPage) => currentPage - 1);
        } else {
          setMentors((currentUsers) => currentUsers.filter((item) => item.id !== user.id));
          setTotalMentors((currentTotal) => Math.max(0, currentTotal - 1));
        }
      } else {
        setMentors((currentUsers) => currentUsers.filter((item) => item.id !== user.id));
        setTotalMentors((currentTotal) => Math.max(0, currentTotal - 1));
      }

      if (selectedUser?.id === user.id) {
        setSelectedUser(null);
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.detail || "Failed to delete mentor");
    } finally {
      setDeletingUserId(null);
    }
  };

  return (
    <AdminPortalShell
      title="Mentor Dashboard"
      subtitle="Mentor records filtered from admin users."
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="w-full max-w-[280px]">
            <label className="mb-1.5 block text-xs uppercase tracking-[0.06em] text-adark">
              Filter By Batch
            </label>
            <select
              value={selectedBatchId}
              onChange={(event) => {
                setSelectedBatchId(event.target.value);
                setPage(1);
              }}
              className="w-full cursor-pointer rounded-[10px] border border-white/[0.12] bg-abg3 px-3.5 py-2.5 text-sm text-white outline-none transition-colors focus:border-blue-400"
            >
              <option value="all" className="bg-abg3 text-white">
                All
              </option>
              {loadingBatches ? (
                <option value="" disabled className="bg-abg3 text-white">
                  Loading batches...
                </option>
              ) : (
                batches.map((batch) => (
                  <option
                    key={batch.id}
                    value={batch.id}
                    className="bg-abg3 text-white"
                  >
                    {batch.label}
                  </option>
                ))
              )}
            </select>
          </div>

          <Button
            onClick={() =>
              navigate("/add-user", {
                state: {
                  userKind: "mentor",
                  returnTo: "/admin/mentor-dashboard",
                },
              })
            }
            className="self-start lg:self-auto !bg-blue font-bold"
            type="primary"
          >
            Add Mentor
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-white/10 bg-white/5 p-5"
            >
              <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-slate-400">
                {card.label}
              </p>
              <p className={`text-3xl font-extrabold ${card.valueClass}`}>
                {card.value}
              </p>
              <p className="mt-2 text-xs text-slate-400">{card.hint}</p>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
          <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
            <div>
              <h2 className="text-sm font-bold">Mentor Information</h2>
              <p className="mt-1 text-xs text-slate-400">{selectedBatchLabel}</p>
            </div>
            <div className="text-xs text-slate-400">
              {selectedBatchId === "all"
                ? `Page ${page} of ${totalPages}`
                : `${totalMentors} mentors`}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  {["Mentor Name", "Email", "Tech Stack", "View", "Edit", "Delete"].map((heading) => (
                    <th
                      key={heading}
                      className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loadingMentors ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-8 text-center text-sm text-slate-400"
                    >
                      Loading mentors...
                    </td>
                  </tr>
                ) : mentors.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-8 text-center text-sm text-slate-400"
                    >
                      No mentors found for this filter.
                    </td>
                  </tr>
                ) : (
                  mentors.map((mentor) => {
                    const isDeleting = deletingUserId === mentor.id;

                    return (
                      <tr
                        key={mentor.id}
                        className="border-b border-white/5 last:border-b-0"
                      >
                        <td className="px-5 py-4 font-semibold text-white">
                          {mentor.username}
                        </td>
                        <td className="px-5 py-4 text-slate-300">
                          {mentor.email}
                        </td>
                        <td className="px-5 py-4 text-slate-300">
                          {mentor.techStack}
                        </td>
                        <td className="px-5 py-4">
                          <button
                            type="button"
                            onClick={() => setSelectedUser(mentor)}
                            className="inline-flex items-center gap-2 rounded-lg border border-sky-400/25 bg-sky-500/10 px-3 py-1.5 text-xs font-bold text-sky-300 transition-colors hover:bg-sky-500/20"
                          >
                            <EyeIcon />
                            View
                          </button>
                        </td>
                        <td className="px-5 py-4">
                          <button
                            type="button"
                            onClick={() =>
                              navigate("/edit-user", {
                                state: {
                                  user: mentor,
                                  userKind: "mentor",
                                  returnTo: "/admin/mentor-dashboard",
                                },
                              })
                            }
                            className="inline-flex min-w-[92px] items-center justify-center gap-2 rounded-[10px] border border-[#F59E0B]-500/40 bg-[#F59E0B]-500/10 px-4 py-2 text-xs font-bold text-amber-300 transition-colors hover:bg-amber-500/20"
                          >
                            <EditIcon />
                            Edit
                          </button>
                        </td>
                        <td className="px-5 py-4">
                          <button
                            type="button"
                            disabled={isDeleting}
                            onClick={() => void handleDeleteUser(mentor)}
                            className="inline-flex min-w-[92px] items-center justify-center gap-2 rounded-[10px] border border--500/35 bg-red-500/10 px-4 py-2 text-xs font-bold text-red-300 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isDeleting ? <div className="loader-btn loader-btn-sm" /> : <DeleteIcon />}
                            {isDeleting ? "Deleting..." : "Delete"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {selectedBatchId === "all" && (
            <div className="flex flex-col gap-3 border-t border-white/10 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-400">
                Showing page {page} of {totalPages} for mentor records.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  className="rounded-lg border border-white/10 px-3 py-1.5 text-sm font-semibold text-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Prev
                </button>
                <button
                  type="button"
                  disabled={page === totalPages}
                  onClick={() =>
                    setPage((value) => Math.min(totalPages, value + 1))
                  }
                  className="rounded-lg border border-white/10 px-3 py-1.5 text-sm font-semibold text-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget) setSelectedUser(null);
          }}
        >
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/10 bg-[#111827] p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  Mentor Details
                </p>
                <h3 className="mt-2 text-2xl font-extrabold text-white">
                  {selectedUser.username}
                </h3>
                <p className="mt-1 text-sm text-slate-400">{selectedUser.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-sm font-semibold text-slate-300 transition-colors hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {[
                { label: "User ID", value: `#${selectedUser.id}` },
                { label: "Name", value: selectedUser.username },
                { label: "Email", value: selectedUser.email },
                { label: "Tech Stack", value: selectedUser.techStack },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-white/10 bg-white/5 p-4"
                >
                  <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">
                    {item.label}
                  </p>
                  <p className="mt-2 break-words text-sm font-semibold text-white">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </AdminPortalShell>
  );
};

export default AdminMentorDashboard;
