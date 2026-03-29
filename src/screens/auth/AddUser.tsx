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
}

const ROLE_OPTIONS = ["Frontend", "Backend", "Others"];

const AddUser = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const editUser = location.state?.user as
    | { id: number; username: string; email: string; phone: string; batch: string; techStack: string; fees?: number }
    | undefined;
  const isEdit = Boolean(editUser);

  const resolveRoleType = (techStack?: string) => {
    if (!techStack) return { roleType: "", customRole: "" };
    if (ROLE_OPTIONS.includes(techStack)) return { roleType: techStack, customRole: "" };
    return { roleType: "Others", customRole: techStack };
  };

  const { roleType: initialRole, customRole: initialCustom } = resolveRoleType(editUser?.techStack);

  const validationSchema = Yup.object({
    username: isEdit
      ? Yup.string()
      : Yup.string().required("Enter your name"),
    email: isEdit
      ? Yup.string().email("Invalid email")
      : Yup.string().email("Invalid email").required("Enter email"),
    password: isEdit
      ? Yup.string()
      : Yup.string().min(6, "Min 6 characters").required("Enter password"),
    roleType: isEdit
      ? Yup.string()
      : Yup.string().required("Select role type"),
    customRole: Yup.string().when("roleType", {
      is: "Others",
      then: (schema) => isEdit ? schema : schema.required("Enter custom role"),
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
  });

  const handleSubmit = async (values: SignupFormValues) => {
    try {
      setLoading(true);

      const techStack =
        values.roleType === "Others" ? values.customRole : values.roleType;

      if (isEdit) {
        const initialTechStack =
          initialRole === "Others" ? initialCustom : initialRole;
        const payload: Record<string, unknown> = {};

        if (values.username && values.username !== (editUser?.username ?? ""))
          payload.username = values.username;
        if (values.email && values.email !== (editUser?.email ?? ""))
          payload.email = values.email;
        if (values.password) payload.password = values.password;
        if (values.batch != null && Number(values.batch) !== (editUser?.batch ? Number(editUser.batch) : null))
          payload.batch = Number(values.batch);
        if (values.fees != null && Number(values.fees) !== (editUser?.fees ?? null))
          payload.total_fee = Number(values.fees);
        if (values.phone != null && String(values.phone) !== (editUser?.phone ?? ""))
          payload.phone = String(values.phone);
        if (techStack && techStack !== initialTechStack)
          payload.tech_stack = techStack;

        if (Object.keys(payload).length === 0) {
          toast.info("No changes to update");
          setLoading(false);
          return;
        }

        await updateUserApi(editUser!.id, payload);
        toast.success("User updated successfully");
      } else {
        const payload = {
          username: values.username,
          email: values.email,
          password: values.password,
          type: 2,
          batch: Number(values.batch),
          total_fee: Number(values.fees),
          phone: String(values.phone),
          tech_stack: techStack,
        };

        await signupApi(payload);
        toast.success("User added successfully");
      }

      navigate("/admin/user-dashboard", { replace: true });
    } catch (error: any) {
      const message = error?.response?.data?.detail || "Something went wrong";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-10 relative bg-[var(--primary-color)] overflow-hidden flex items-center justify-center font-body px-4">
      <div className="absolute inset-0 bg-[var(--primary-color)]" />
      <div className="absolute top-[-80px] left-[-80px] h-[240px] w-[240px] rounded-full bg-sky-200/40 blur-[80px]" />
      <div className="absolute bottom-[-100px] right-[-60px] h-[280px] w-[280px] rounded-full bg-blue-200/40 blur-[90px]" />

      <div
        className="relative z-10 w-full max-w-[520px] rounded-[20px] px-10 py-9 
        bg-white/95 backdrop-blur-xl
        border border-slate-200
        shadow-[0_20px_60px_rgba(15,23,42,0.12)]"
      >
        <h2 className="text-[26px] font-heading font-semibold text-slate-900 mb-5">
          {isEdit ? "Edit" : "Add"} <span className="text-[#2563eb]">User</span>
        </h2>

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
          }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ values, setFieldValue }) => (
            <Form className="space-y-5 flex flex-col">

              <FormInput label="USER NAME" name="username" type="text" />

              <FormInput label="EMAIL ADDRESS" name="email" type="email" />

              <FormInput
                label={isEdit ? "PASSWORD (leave blank to keep)" : "PASSWORD"}
                name="password"
                type="password"
                placeholder={isEdit ? "Leave blank to keep current" : undefined}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormInput label="PHONE" name="phone" type="number" />
                <FormInput label="BATCH" name="batch" type="number" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] tracking-[1px] text-[#8a8aa3] mb-2 block">ROLE TYPE</label>
                  <select
                    value={values.roleType}
                    onChange={(e) => {
                      setFieldValue("roleType", e.target.value)
                      if (e.target.value !== "Others") setFieldValue("customRole", "")
                    }}
                    className="w-full h-[46px] rounded-[12px] bg-transparent border border-[#3b82f6] px-4 text-sm text-slate-900 outline-none transition-colors focus:border-[#3b82f6] focus:shadow-md cursor-pointer"
                  >
                    <option value="" disabled>Select role</option>
                    <option value="Frontend">Frontend</option>
                    <option value="Backend">Backend</option>
                    <option value="Others">Others</option>
                  </select>
                  <ErrorMessage name="roleType" component="p" className="text-red-400 text-[11px] mt-1" />
                </div>
                <FormInput label="FEES" name="fees" type="number" />
              </div>

              {values.roleType === "Others" && (
                <FormInput label="CUSTOM ROLE" name="customRole" type="text" />
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-[14px] rounded-[12px] text-white text-[14px] font-semibold
                bg-gradient-to-r from-[#2563eb] to-[#3b82f6]
                shadow-[0_8px_30px_rgba(37,99,235,0.35)]
                hover:opacity-95 transition duration-200
                flex items-center justify-center gap-2"
              >
                <span className="flex h-6 w-[120px] items-center justify-center">
                  {loading ? <div className="loader-btn loader-btn-sm" /> : isEdit ? "Update User" : "Add User"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => navigate("/admin/user-dashboard")}
                className="text-[#2563eb] text-sm hover:underline mx-auto"
              >
                Back
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default AddUser;