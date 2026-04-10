import { Formik, Form, ErrorMessage } from "formik";
import { useNavigate, useLocation } from "react-router-dom";
import * as Yup from "yup";
import { useState } from "react";
import { toast } from "react-toastify";
import FormInput from "../../components/form/FormInput";
import { signupApi, updateUserApi } from "../../services/authApi";

interface SignupFormValues {
  username: string;
  email: string;
  password: string;
  roleType: string;
  customRole?: string;
  phone: number | null;
  batch: number | null;
  fees: number | null;
  monthlyInstallment: boolean | null;
  emiAmount: number | null;
}

const ROLE_OPTIONS = ["Frontend", "Backend", "Others"];

interface UserFormState {
  user?: {
    id: number;
    username: string;
    email: string;
    phone: string;
    batch: string;
    techStack: string;
    fees?: number;
    monthly_installment?: boolean;
    emi_amount?: number;
  };
  userKind?: "intern" | "mentor";
  returnTo?: string;
}

const AddUser = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const pageState = (location.state ?? {}) as UserFormState;

  const editUser = pageState.user;
  const isEdit = Boolean(editUser);
  const userKind = pageState.userKind ?? "intern";
  const entityLabel = userKind === "mentor" ? "Mentor" : "Intern";
  const submitLabel = isEdit ? `Update ${entityLabel}` : `Add ${entityLabel}`;
  const returnPath =
    pageState.returnTo ??
    (userKind === "mentor"
      ? "/admin/mentor-dashboard"
      : "/admin/intern-dashboard");

  const resolveRoleType = (techStack?: string) => {
    if (!techStack) return { roleType: "", customRole: "" };
    if (ROLE_OPTIONS.includes(techStack))
      return { roleType: techStack, customRole: "" };
    return { roleType: "Others", customRole: techStack };
  };

  const { roleType: initialRole, customRole: initialCustom } = resolveRoleType(
    editUser?.techStack,
  );

  const validationSchema = Yup.object({
    username: isEdit ? Yup.string() : Yup.string().required("Enter your name"),
    email: isEdit
      ? Yup.string().email("Invalid email")
      : Yup.string().email("Invalid email").required("Enter email"),
    password: isEdit
      ? Yup.string()
      : Yup.string().min(6, "Min 6 characters").required("Enter password"),
    roleType: isEdit ? Yup.string() : Yup.string().required("Select role type"),
    customRole: Yup.string().when("roleType", {
      is: "Others",
      then: (schema) =>
        isEdit ? schema : schema.required("Enter custom role"),
    }),
    phone: isEdit
      ? Yup.number().nullable().notRequired()
      : Yup.number().typeError("Enter phone").required("Enter number"),
    batch: isEdit
      ? Yup.number().nullable().notRequired()
      : Yup.number().typeError("Enter batch").required("Enter batch"),
    fees: isEdit
      ? Yup.number().nullable().notRequired()
      : Yup.number().typeError("Enter fees").required("Enter fees"),
    monthlyInstallment: isEdit
      ? Yup.boolean().nullable().notRequired()
      : Yup.boolean().nullable().required("Select monthly installment"),
    emiAmount: isEdit
      ? Yup.number().nullable().notRequired()
      : Yup.number()
          .nullable()
          .typeError("Enter EMI amount")
          .required("Enter EMI amount")
          .min(0, "EMI amount cannot be negative"),
  });

  const handleSubmit = async (values: SignupFormValues) => {
    try {
      setLoading(true);

      const techStack =
        (values.roleType === "Others" ? values.customRole : values.roleType) ??
        "";
      const monthlyInstallmentValue = values.monthlyInstallment === true;
      const emiAmountValue = Number(values.emiAmount ?? 0);

      if (isEdit) {
        const initialTechStack =
          initialRole === "Others" ? initialCustom : initialRole;
        const payload: Record<string, unknown> = {};

        if (values.username && values.username !== (editUser?.username ?? ""))
          payload.username = values.username;
        if (values.email && values.email !== (editUser?.email ?? ""))
          payload.email = values.email;
        if (values.password) payload.password = values.password;
        if (
          values.batch != null &&
          Number(values.batch) !==
            (editUser?.batch ? Number(editUser.batch) : null)
        )
          payload.batch = Number(values.batch);
        if (
          values.fees != null &&
          Number(values.fees) !== (editUser?.fees ?? null)
        )
          payload.total_fee = Number(values.fees);
        if (
          values.monthlyInstallment != null &&
          values.monthlyInstallment !== (editUser?.monthly_installment ?? null)
        )
          payload.monthly_installment = monthlyInstallmentValue;
        if (
          values.emiAmount != null &&
          Number(values.emiAmount) !== Number(editUser?.emi_amount ?? 0)
        )
          payload.emi_amount = emiAmountValue;
        if (
          values.phone != null &&
          String(values.phone) !== (editUser?.phone ?? "")
        )
          payload.phone = String(values.phone);
        if (techStack && techStack !== initialTechStack)
          payload.tech_stack = techStack;

        if (Object.keys(payload).length === 0) {
          toast.info("No changes to update");
          setLoading(false);
          return;
        }

        await updateUserApi(editUser!.id, payload);
        toast.success(`${entityLabel} updated successfully`);
      } else {
        const payload = {
          username: values.username,
          email: values.email,
          password: values.password,
          type: 2,
          batch: Number(values.batch),
          monthly_installment: monthlyInstallmentValue,
          emi_amount: emiAmountValue,
          total_fee: Number(values.fees),
          phone: String(values.phone),
          tech_stack: techStack,
        };

        await signupApi(payload);
        toast.success(`${entityLabel} added successfully`);
      }

      navigate(returnPath, { replace: true });
    } catch (error: any) {
      const message = error?.response?.data?.detail || "Something went wrong";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const selectClass =
    "w-full h-[46px] rounded-[12px] bg-transparent border border-[#3b82f6] px-4 text-sm text-slate-900 outline-none transition-colors focus:border-[#3b82f6] focus:shadow-md cursor-pointer";

  return (
    <div className="min-h-screen py-6 sm:py-10 relative bg-[var(--primary-color)] overflow-hidden flex items-center justify-center font-body px-3 sm:px-4">
      <div className="absolute inset-0 bg-[var(--primary-color)]" />
      <div className="absolute top-[-80px] left-[-80px] h-[240px] w-[240px] rounded-full bg-sky-200/40 blur-[80px]" />
      <div className="absolute bottom-[-100px] right-[-60px] h-[280px] w-[280px] rounded-full bg-blue-200/40 blur-[90px]" />

      <div
        className="relative z-10 w-full max-w-[920px] rounded-[20px] px-4 sm:px-6 md:px-10 py-6 sm:py-8 md:py-9 
        bg-white/95 backdrop-blur-xl
        border border-slate-200
        shadow-[0_20px_60px_rgba(15,23,42,0.12)]"
      >
        <div className="mb-6 sm:mb-7">
          <p className="text-[11px] tracking-[0.16em] uppercase text-slate-500">
            Admin Portal
          </p>
          <h2 className="text-2xl sm:text-[28px] font-heading font-semibold text-slate-900 mt-2">
            {isEdit ? "Edit" : "Add"}{" "}
            <span className="text-[#2563eb]">{entityLabel}</span>
          </h2>
        </div>

        <Formik
          initialValues={{
            username: editUser?.username ?? "",
            email: editUser?.email ?? "",
            password: "",
            roleType: initialRole,
            customRole: initialCustom,
            phone: editUser?.phone ? Number(editUser.phone) : null,
            batch: editUser?.batch ? Number(editUser.batch) : null,
            fees: editUser?.fees ?? null,
            monthlyInstallment: editUser?.monthly_installment ?? false,
            emiAmount: editUser?.emi_amount ?? 0,
          }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ values, setFieldValue }) => (
            <Form className="space-y-6">
              <section className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4 md:p-5">
                <h3 className="text-sm font-semibold text-slate-700 mb-4">
                  Basic Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput label="FULL NAME" name="username" type="text" />
                  <FormInput label="EMAIL ADDRESS" name="email" type="email" />
                  <FormInput
                    label={
                      isEdit ? "PASSWORD (leave blank to keep)" : "PASSWORD"
                    }
                    name="password"
                    type="password"
                    placeholder={
                      isEdit ? "Leave blank to keep current" : undefined
                    }
                  />
                  <FormInput label="PHONE" name="phone" type="number" />
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4 md:p-5">
                <h3 className="text-sm font-semibold text-slate-700 mb-4">
                  Program Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput label="BATCH" name="batch" type="number" />

                  <div>
                    <label className="text-[11px] tracking-[1px] text-[#8a8aa3] mb-2 block">
                      ROLE TYPE
                    </label>
                    <select
                      value={values.roleType}
                      onChange={(e) => {
                        setFieldValue("roleType", e.target.value);
                        if (e.target.value !== "Others") {
                          setFieldValue("customRole", "");
                        }
                      }}
                      className={selectClass}
                    >
                      <option value="" disabled>
                        Select role
                      </option>
                      <option value="React">React</option>
                      <option value="Python">Python</option>
                      <option value="IOT">IOT</option>
                      <option value="Others">Others</option>
                    </select>
                    <ErrorMessage
                      name="roleType"
                      component="p"
                      className="text-red-400 text-[11px] mt-1"
                    />
                  </div>
                </div>
                {values.roleType === "Others" && (
                  <div className="mt-4">
                    <FormInput
                      label="CUSTOM ROLE"
                      name="customRole"
                      type="text"
                    />
                  </div>
                )}
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4 md:p-5">
                <h3 className="text-sm font-semibold text-slate-700 mb-4">
                  Fee Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormInput label="TOTAL FEE" name="fees" type="number" />

                  <div>
                    <label className="text-[11px] tracking-[1px] text-[#8a8aa3] mb-2 block">
                      MONTHLY INSTALLMENT
                    </label>
                    <select
                      value={
                        values.monthlyInstallment === null
                          ? ""
                          : values.monthlyInstallment
                            ? "true"
                            : "false"
                      }
                      onChange={(e) => {
                        if (e.target.value === "") {
                          setFieldValue("monthlyInstallment", null);
                          return;
                        }
                        setFieldValue(
                          "monthlyInstallment",
                          e.target.value === "true",
                        );
                      }}
                      className={selectClass}
                    >
                      <option value="" disabled>
                        Select option
                      </option>
                      <option value="true">true</option>
                      <option value="false">false</option>
                    </select>
                    <ErrorMessage
                      name="monthlyInstallment"
                      component="p"
                      className="text-red-400 text-[11px] mt-1"
                    />
                  </div>

                  <FormInput
                    label="EMI AMOUNT"
                    name="emiAmount"
                    type="number"
                  />
                </div>
              </section>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => navigate(returnPath)}
                  className="w-full sm:w-auto px-5 py-3 rounded-[12px] border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-100 transition"
                >
                  Back
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-6 py-3 rounded-[12px] text-white text-sm font-semibold
                  bg-gradient-to-r from-[#2563eb] to-[#3b82f6]
                  shadow-[0_8px_30px_rgba(37,99,235,0.35)]
                  hover:opacity-95 transition duration-200
                  flex items-center justify-center"
                >
                  <span className="flex h-6 min-w-[120px] items-center justify-center">
                    {loading ? (
                      <div className="loader-btn loader-btn-sm" />
                    ) : (
                      submitLabel
                    )}
                  </span>
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default AddUser;
