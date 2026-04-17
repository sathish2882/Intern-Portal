import { useEffect, useMemo, useState } from "react";
import { Button } from "antd";
import { ErrorMessage, Field, Form, Formik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import AdminPortalShell from "../../components/layout/AdminPortalShell";
import {
  addMentorApi,
  getAllMentorsApi,
  deleteMentorApi,
  updateMentorApi,
} from "../../services/adminApi";

interface MentorUser {
  current_task_id: number | null;
  updated_at: string;
  type: number;
  created_by: string;
  status: number;
  username: string;
  is2FA: boolean;
  batch: number;
  user_id: number;
  phone: string;
  email: string;
  tech_stack: string;
  password: string;
  created_at: string;
}

interface AddMentorForm {
  username: string;
  email: string;
  password: string;
  batch: string;
  phone: string;
  tech_stack: string;
}

const PAGE_SIZE = 10;

const EMPTY_FORM: AddMentorForm = {
  username: "",
  email: "",
  password: "",
  batch: "",
  phone: "",
  tech_stack: "",
};

const addMentorValidationSchema = Yup.object({
  username: Yup.string().trim().required("Username is required"),
  email: Yup.string()
    .trim()
    .email("Invalid email")
    .required("Email is required"),
  password: Yup.string()
    .trim()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
  batch: Yup.number()
    .transform((_value, originalValue) =>
      String(originalValue).trim() === "" ? NaN : Number(originalValue),
    )
    .typeError("Batch must be a valid number")
    .min(0, "Batch cannot be negative")
    .required("Batch is required"),
  phone: Yup.string().trim().required("Phone is required"),
  tech_stack: Yup.string().trim().required("Tech stack is required"),
});

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

const normalizeMentors = (payload: unknown): MentorUser[] => {
  return toArray(payload)
    .map((item) => {
      if (typeof item !== "object" || item === null) return null;
      const mentor = item as Record<string, unknown>;

      const userId = Number(mentor.user_id ?? mentor.id);
      const username = String(mentor.username ?? "").trim();
      if (!Number.isFinite(userId) || !username) return null;

      return {
        current_task_id:
          mentor.current_task_id === null ||
          mentor.current_task_id === undefined
            ? null
            : Number(mentor.current_task_id),
        updated_at: String(mentor.updated_at ?? ""),
        type: Number(mentor.type ?? 0),
        created_by: String(mentor.created_by ?? "-"),
        status: Number(mentor.status ?? 0),
        username,
        is2FA: Boolean(mentor.is2FA),
        batch: Number(mentor.batch ?? 0),
        user_id: userId,
        phone: String(mentor.phone ?? mentor.phno ?? "-"),
        email: String(mentor.email ?? "-"),
        tech_stack: String(mentor.tech_stack ?? "-"),
        password: String(mentor.password ?? "-"),
        created_at: String(mentor.created_at ?? ""),
      };
    })
    .filter((mentor): mentor is MentorUser => Boolean(mentor));
};

const EyeIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    className="shrink-0"
  >
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

const DeleteIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    className="shrink-0"
  >
    <path
      d="M4 7h16"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path
      d="M10 11v6"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path
      d="M14 11v6"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <path
      d="M6 7l1 11a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-11"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const getStatusText = (status: number) => {
  if (status === 1) return "Active";
  if (status === 0) return "Inactive";
  return `Status ${status}`;
};

const AdminMentorDashboard = () => {
  const [allMentors, setAllMentors] = useState<MentorUser[]>([]);
  const [loadingMentors, setLoadingMentors] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<MentorUser | null>(null);
  const [editMentor, setEditMentor] = useState<MentorUser | null>(null);
  const [updatingMentor, setUpdatingMentor] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState("all");
  const [page, setPage] = useState(1);

  const [showAddMentorForm, setShowAddMentorForm] = useState(false);
  const [addingMentor, setAddingMentor] = useState(false);

  const loadMentors = async () => {
    try {
      setLoadingMentors(true);
      const response = await getAllMentorsApi();
      const payload =
        response?.data?.data ?? response?.data?.users ?? response?.data;
      setAllMentors(normalizeMentors(payload));
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.detail || "Failed to load mentors");
    } finally {
      setLoadingMentors(false);
    }
  };

  useEffect(() => {
    void loadMentors();
  }, []);

  const batchOptions = useMemo(() => {
    return Array.from(
      new Set(allMentors.map((mentor) => String(mentor.batch))),
    ).sort((a, b) => Number(a) - Number(b));
  }, [allMentors]);

  const filteredMentors = useMemo(() => {
    if (selectedBatchId === "all") return allMentors;
    return allMentors.filter(
      (mentor) => String(mentor.batch) === selectedBatchId,
    );
  }, [allMentors, selectedBatchId]);

  const totalMentors = filteredMentors.length;
  const totalPages = Math.max(1, Math.ceil(totalMentors / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const mentors = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredMentors.slice(start, start + PAGE_SIZE);
  }, [filteredMentors, page]);

  const activeCount = useMemo(
    () => filteredMentors.filter((mentor) => mentor.status === 1).length,
    [filteredMentors],
  );

  const stats = useMemo(
    () => [
      {
        label: "Total Mentors",
        value: String(totalMentors),
        hint:
          selectedBatchId === "all"
            ? "All batches"
            : `Batch ${selectedBatchId}`,
        valueClass: "text-white",
      },
      {
        label: "Active Mentors",
        value: String(activeCount),
        hint: "status = 1",
        valueClass: "text-emerald-300",
      },
      {
        label: "Visible In Table",
        value: String(mentors.length),
        hint: `Page ${page} of ${totalPages}`,
        valueClass: "text-sky-300",
      },
      {
        label: "Batch Count",
        value: String(batchOptions.length),
        hint: "Unique mentor batches",
        valueClass: "text-amber-300",
      },
    ],
    [
      activeCount,
      batchOptions.length,
      mentors.length,
      page,
      selectedBatchId,
      totalMentors,
      totalPages,
    ],
  );

  const handleDeleteMentor = async (mentor: MentorUser) => {
    if (deletingUserId !== null) return;
    const shouldDelete = window.confirm(
      `Delete mentor ${mentor.username} (#${mentor.user_id})?`,
    );
    if (!shouldDelete) return;
    try {
      setDeletingUserId(mentor.user_id);
      await deleteMentorApi(mentor.user_id);
      toast.success("Mentor deleted successfully");
      if (selectedUser?.user_id === mentor.user_id) setSelectedUser(null);
      await loadMentors();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.detail || "Failed to delete mentor");
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleUpdateMentor = async (values: AddMentorForm) => {
    if (!editMentor) return;
    try {
      setUpdatingMentor(true);
      await updateMentorApi(editMentor.user_id, {
        username: values.username.trim(),
        email: values.email.trim(),
        password: values.password.trim(),
        batch: Number(values.batch),
        phone: values.phone.trim(),
        tech_stack: values.tech_stack.trim(),
      });
      toast.success("Mentor updated successfully");
      setEditMentor(null);
      await loadMentors();
    } catch (error: any) {
      console.error(error);
      const detail = error?.response?.data?.detail;
      const message = Array.isArray(detail)
        ? detail
            .map((item: { msg?: string }) => item.msg)
            .filter(Boolean)
            .join(", ")
        : detail || "Failed to update mentor";
      toast.error(message);
    } finally {
      setUpdatingMentor(false);
    }
  };

  const handleAddMentor = async (
    values: AddMentorForm,
    resetForm: () => void,
  ) => {
    try {
      setAddingMentor(true);
      await addMentorApi({
        username: values.username.trim(),
        email: values.email.trim(),
        password: values.password.trim(),
        batch: Number(values.batch),
        phone: values.phone.trim(),
        tech_stack: values.tech_stack.trim(),
      });
      toast.success("Mentor added successfully");
      resetForm();
      setShowAddMentorForm(false);
      setSelectedBatchId("all");
      setPage(1);
      await loadMentors();
    } catch (error: any) {
      console.error(error);
      const detail = error?.response?.data?.detail;
      const message = Array.isArray(detail)
        ? detail
            .map((item: { msg?: string }) => item.msg)
            .filter(Boolean)
            .join(", ")
        : detail || "Failed to add mentor";
      toast.error(message);
    } finally {
      setAddingMentor(false);
    }
  };

  return (
    <AdminPortalShell
      title="Mentor Dashboard"
      subtitle="Mentor management from get_all_mentors and add_mentor APIs."
    >
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
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
              className="w-full cursor-pointer rounded-[10px] border border-white/[0.12] bg-abg3 px-3.5 py-2.5 text-sm text-white outline-none transition-colors focus:border-sky-400"
            >
              <option value="all" className="bg-abg3 text-white">
                All Batches
              </option>
              {batchOptions.map((batch) => (
                <option
                  key={batch}
                  value={batch}
                  className="bg-abg3 text-white"
                >
                  Batch {batch}
                </option>
              ))}
            </select>
          </div>

          <Button
            type="primary"
            className="ml-auto md:self-end !bg-blue font-bold"
            onClick={() => setShowAddMentorForm(true)}
          >
            Add Mentor
          </Button>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between gap-4">
            <h2 className="text-sm font-bold">Mentor Information</h2>
            <p className="text-xs text-slate-400">
              Page {page} of {totalPages}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  {[
                    "Username",
                    "Email",
                    "Batch",
                    "Phone",
                    "Tech Stack",
                    "Status",
                    "View",
                    "Edit",
                    "Delete",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="text-left px-5 py-3 text-[11px] uppercase tracking-[0.14em] text-slate-400 font-medium"
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
                      colSpan={8}
                      className="px-5 py-8 text-center text-sm text-slate-400"
                    >
                      Loading mentors...
                    </td>
                  </tr>
                ) : mentors.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-8 text-center text-sm text-slate-400"
                    >
                      No mentors found for this filter.
                    </td>
                  </tr>
                ) : (
                  mentors.map((mentor) => {
                    const isDeleting = deletingUserId === mentor.user_id;
                    return (
                      <tr
                        key={mentor.user_id}
                        className="border-b border-white/5 last:border-b-0"
                      >
                        <td className="px-5 py-4 font-semibold text-white">
                          {mentor.username}
                        </td>
                        <td className="px-5 py-4 text-slate-300">
                          {mentor.email}
                        </td>
                        <td className="px-5 py-4 text-slate-300">
                          {mentor.batch}
                        </td>
                        <td className="px-5 py-4 text-slate-300">
                          {mentor.phone}
                        </td>
                        <td className="px-5 py-4 text-slate-300">
                          {mentor.tech_stack}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                              mentor.status === 1
                                ? "bg-emerald-500/15 text-emerald-300 border border-emerald-400/20"
                                : "bg-red-500/15 text-red-300 border border-red-400/20"
                            }`}
                          >
                            {getStatusText(mentor.status)}
                          </span>
                        </td>
                        <td className="px-5 py-4 flex gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedUser(mentor)}
                            className="inline-flex items-center gap-2 rounded-lg border border-sky-400/25 bg-sky-500/10 px-3 py-1.5 text-xs font-bold text-sky-300 transition-colors hover:bg-sky-500/20"
                          >
                            <EyeIcon />
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditMentor(mentor)}
                            className="inline-flex items-center gap-2 rounded-lg border border-amber-400/25 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-300 transition-colors hover:bg-amber-500/20"
                          >
                            Edit
                          </button>
                        </td>
                        {editMentor && (
                          <div
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
                            onClick={(event) => {
                              if (
                                event.target === event.currentTarget &&
                                !updatingMentor
                              ) {
                                setEditMentor(null);
                              }
                            }}
                          >
                            <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#111827] p-6 shadow-2xl">
                              <div className="mb-5 flex items-center justify-between gap-3">
                                <div>
                                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                                    Mentor Form
                                  </p>
                                  <h3 className="mt-1 text-xl font-bold text-white">
                                    Edit Mentor
                                  </h3>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setEditMentor(null)}
                                  disabled={updatingMentor}
                                  className="rounded-lg border border-white/10 px-3 py-1.5 text-sm font-semibold text-slate-300 hover:text-white disabled:opacity-50"
                                >
                                  Close
                                </button>
                              </div>

                              <Formik
                                initialValues={{
                                  username: editMentor.username,
                                  email: editMentor.email,
                                  password: editMentor.password,
                                  batch: String(editMentor.batch),
                                  phone: editMentor.phone,
                                  tech_stack: editMentor.tech_stack,
                                }}
                                validationSchema={addMentorValidationSchema}
                                onSubmit={async (values, { setSubmitting }) => {
                                  await handleUpdateMentor(values);
                                  setSubmitting(false);
                                }}
                                enableReinitialize
                              >
                                {({ isSubmitting, resetForm }) => (
                                  <Form>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                      <div>
                                        <label className="mb-1.5 block text-xs text-slate-300">
                                          Username
                                        </label>
                                        <Field
                                          name="username"
                                          className="w-full rounded-lg border border-white/10 bg-abg3 px-3 py-2 text-sm text-white outline-none focus:border-blue-400"
                                          placeholder="Enter username"
                                        />
                                        <ErrorMessage
                                          name="username"
                                          component="div"
                                          className="mt-1 text-xs text-red-300"
                                        />
                                      </div>
                                      <div>
                                        <label className="mb-1.5 block text-xs text-slate-300">
                                          Email
                                        </label>
                                        <Field
                                          type="email"
                                          name="email"
                                          className="w-full rounded-lg border border-white/10 bg-abg3 px-3 py-2 text-sm text-white outline-none focus:border-blue-400"
                                          placeholder="user@example.com"
                                        />
                                        <ErrorMessage
                                          name="email"
                                          component="div"
                                          className="mt-1 text-xs text-red-300"
                                        />
                                      </div>
                                      <div>
                                        <label className="mb-1.5 block text-xs text-slate-300">
                                          Password
                                        </label>
                                        <Field
                                          type="password"
                                          name="password"
                                          className="w-full rounded-lg border border-white/10 bg-abg3 px-3 py-2 text-sm text-white outline-none focus:border-blue-400"
                                          placeholder="Enter password (leave blank to keep unchanged)"
                                        />
                                        <ErrorMessage
                                          name="password"
                                          component="div"
                                          className="mt-1 text-xs text-red-300"
                                        />
                                      </div>
                                      <div>
                                        <label className="mb-1.5 block text-xs text-slate-300">
                                          Batch
                                        </label>
                                        <Field
                                          type="number"
                                          min={0}
                                          name="batch"
                                          className="w-full rounded-lg border border-white/10 bg-abg3 px-3 py-2 text-sm text-white outline-none focus:border-blue-400"
                                          placeholder="Enter batch number"
                                        />
                                        <ErrorMessage
                                          name="batch"
                                          component="div"
                                          className="mt-1 text-xs text-red-300"
                                        />
                                      </div>
                                      <div>
                                        <label className="mb-1.5 block text-xs text-slate-300">
                                          Phone
                                        </label>
                                        <Field
                                          name="phone"
                                          type="number"
                                          inputMode="numeric"
                                          onInput={(e: any) => {
                                            if (e.target.value.length > 10) {
                                              e.target.value =
                                                e.target.value.slice(0, 10);
                                            }
                                          }}
                                          className="w-full rounded-lg border border-white/10 bg-abg3 px-3 py-2 text-sm text-white outline-none focus:border-blue-400"
                                          placeholder="Enter phone number"
                                        />
                                        <ErrorMessage
                                          name="phone"
                                          component="div"
                                          className="mt-1 text-xs text-red-300"
                                        />
                                      </div>
                                      <div>
                                        <label className="mb-1.5 block text-xs text-slate-300">
                                          Tech Stack
                                        </label>
                                        <Field
                                          as="select"
                                          name="tech_stack"
                                          className="w-full rounded-lg border border-white/10 bg-abg3 px-3 py-2 text-sm text-white outline-none focus:border-blue-400"
                                          placeholder="Enter tech stack"
                                        >
                                          <option value="">
                                            Select tech stack
                                          </option>
                                          <option value="Frontend">
                                            React
                                          </option>
                                          <option value="Backend">
                                            Python
                                          </option>
                                          <option value="Fullstack">IOT</option>

                                          <option value="Others">Others</option>
                                        </Field>
                                        <ErrorMessage
                                          name="tech_stack"
                                          component="div"
                                          className="mt-1 text-xs text-red-300"
                                        />
                                      </div>
                                    </div>

                                    <div className="mt-6 flex items-center justify-end gap-2">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          resetForm();
                                          setEditMentor(null);
                                        }}
                                        disabled={
                                          updatingMentor || isSubmitting
                                        }
                                        className="rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white disabled:opacity-50"
                                      >
                                        Cancel
                                      </button>
                                      <Button
                                        type="primary"
                                        htmlType="submit"
                                        loading={updatingMentor || isSubmitting}
                                        disabled={
                                          updatingMentor || isSubmitting
                                        }
                                      >
                                        Update Mentor
                                      </Button>
                                    </div>
                                  </Form>
                                )}
                              </Formik>
                            </div>
                          </div>
                        )}
                        <td className="px-5 py-4">
                          <button
                            type="button"
                            disabled={isDeleting}
                            onClick={() => void handleDeleteMentor(mentor)}
                            className="inline-flex min-w-[92px] items-center justify-center gap-2 rounded-lg border border-red-400/25 bg-red-500/10 px-3.5 py-1.5 text-xs font-bold text-red-300 transition-colors hover:bg-red-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {isDeleting ? (
                              <div className="loader-btn loader-btn-sm" />
                            ) : (
                              <DeleteIcon />
                            )}
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

          <div className="px-5 py-3 border-t border-white/10 flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Showing page {page} of {totalPages} for mentor records.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-sm font-semibold text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Prev
              </button>
              <button
                type="button"
                disabled={page === totalPages}
                onClick={() =>
                  setPage((value) => Math.min(totalPages, value + 1))
                }
                className="rounded-lg border border-white/10 px-3 py-1.5 text-sm font-semibold text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {showAddMentorForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget && !addingMentor) {
              setShowAddMentorForm(false);
            }
          }}
        >
          <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#111827] p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                  Mentor Form
                </p>
                <h3 className="mt-1 text-xl font-bold text-white">
                  Add Mentor
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddMentorForm(false)}
                disabled={addingMentor}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-sm font-semibold text-slate-300 hover:text-white disabled:opacity-50"
              >
                Close
              </button>
            </div>

            <Formik
              initialValues={EMPTY_FORM}
              validationSchema={addMentorValidationSchema}
              onSubmit={async (values, { resetForm, setSubmitting }) => {
                await handleAddMentor(values, resetForm);
                setSubmitting(false);
              }}
            >
              {({ isSubmitting, resetForm }) => (
                <Form>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs text-slate-300">
                        Username
                      </label>
                      <Field
                        name="username"
                        className="w-full rounded-lg border border-white/10 bg-abg3 px-3 py-2 text-sm text-white outline-none focus:border-blue-400"
                        placeholder="Enter username"
                      />
                      <ErrorMessage
                        name="username"
                        component="div"
                        className="mt-1 text-xs text-red-300"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs text-slate-300">
                        Email
                      </label>
                      <Field
                        type="email"
                        name="email"
                        className="w-full rounded-lg border border-white/10 bg-abg3 px-3 py-2 text-sm text-white outline-none focus:border-blue-400"
                        placeholder="user@example.com"
                      />
                      <ErrorMessage
                        name="email"
                        component="div"
                        className="mt-1 text-xs text-red-300"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs text-slate-300">
                        Password
                      </label>
                      <Field
                        type="password"
                        name="password"
                        className="w-full rounded-lg border border-white/10 bg-abg3 px-3 py-2 text-sm text-white outline-none focus:border-blue-400"
                        placeholder="Enter password"
                      />
                      <ErrorMessage
                        name="password"
                        component="div"
                        className="mt-1 text-xs text-red-300"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs text-slate-300">
                        Batch
                      </label>
                      <Field
                        type="number"
                        min={0}
                        name="batch"
                        className="w-full rounded-lg border border-white/10 bg-abg3 px-3 py-2 text-sm text-white outline-none focus:border-blue-400"
                        placeholder="Enter batch number"
                      />
                      <ErrorMessage
                        name="batch"
                        component="div"
                        className="mt-1 text-xs text-red-300"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs text-slate-300">
                        Phone
                      </label>
                      <Field
                        name="phone"
                        type="number"
                        inputMode="numeric"
                        onInput={(e: any) => {
                          if (e.target.value.length > 10) {
                            e.target.value = e.target.value.slice(0, 10);
                          }
                        }}
                        className="w-full rounded-lg border border-white/10 bg-abg3 px-3 py-2 text-sm text-white outline-none focus:border-blue-400"
                        placeholder="Enter phone number"
                      />
                      <ErrorMessage
                        name="phone"
                        component="div"
                        className="mt-1 text-xs text-red-300"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs text-slate-300">
                        Tech Stack
                      </label>
                      <Field
                        as="select"
                        name="tech_stack"
                        className="w-full rounded-lg border border-white/10 bg-abg3 px-3 py-2 text-sm text-white outline-none focus:border-blue-400"
                        placeholder="Enter tech stack"
                      >
                        <option value="">Select tech stack</option>
                        <option value="Frontend">React</option>
                        <option value="Backend">Python</option>
                        <option value="Fullstack">IOT</option>
                        <option value="Others">Others</option>
                      </Field>
                      <ErrorMessage
                        name="tech_stack"
                        component="div"
                        className="mt-1 text-xs text-red-300"
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        resetForm();
                        setShowAddMentorForm(false);
                      }}
                      disabled={addingMentor || isSubmitting}
                      className="rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={addingMentor || isSubmitting}
                      disabled={addingMentor || isSubmitting}
                    >
                      Add Mentor
                    </Button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      )}

      {selectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget) setSelectedUser(null);
          }}
        >
          <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-[#111827] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  User Details
                </p>
                <h3 className="mt-2 text-2xl font-extrabold text-white">
                  {selectedUser.username}
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  {selectedUser.email}
                </p>
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
                { label: "User ID", value: String(selectedUser.user_id) },
                { label: "Username", value: selectedUser.username },
                { label: "Email", value: selectedUser.email },
                { label: "Phone", value: selectedUser.phone },

                { label: "Tech Stack", value: selectedUser.tech_stack },

                { label: "Created By", value: selectedUser.created_by },
                {
                  label: "Status",
                  value: `${selectedUser.status} (${getStatusText(selectedUser.status)})`,
                },
                { label: "Batch", value: String(selectedUser.batch) },
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
