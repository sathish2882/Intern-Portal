import { Formik, Form } from "formik";
import { useNavigate } from "react-router-dom";
import * as Yup from "yup";
import { useState } from "react";
import { toast } from "react-toastify";
import { Button, Select } from "antd";
import FormInput from "../../components/form/FormInput";
import { signupApi } from "../../services/authApi";

const { Option } = Select;

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

const AddUser = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validationSchema = Yup.object({
    username: Yup.string().required("Enter your name"),
    email: Yup.string().email("Invalid email").required("Enter email"),
    password: Yup.string()
      .min(6, "Min 6 characters")
      .required("Enter password"),
    roleType: Yup.string().required("Select role type"),
    customRole: Yup.string().when("roleType", {
      is: "Others",
      then: (schema) => schema.required("Enter custom role"),
    }),
    phone: Yup.number().typeError("Enter batch").required("Enter number"),
    batch: Yup.number().typeError("Enter batch").required("Enter batch"),
    fees: Yup.number().typeError("Enter fees").required("Enter fees"),
  });

  const handleSubmit = async (values: SignupFormValues) => {
    try {
      setLoading(true);

      const payload = {
        username: values.username,
        email: values.email,
        password: values.password,
        type: 2,
        batch: Number(values.batch),
        total_fee: Number(values.fees),
        phone: String(values.phone),
        tech_stack:
          values.roleType === "Others"
            ? values.customRole
            : values.roleType,
      };

      await signupApi(payload);

      toast.success("User Added successfully");
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
          Add <span className="text-[#2563eb]">User</span>
        </h2>

        <Formik
          initialValues={{
            username: "",
            email: "",
            password: "",
            roleType: "",
            customRole: "",
            phone: null,
            batch: null,
            fees: null,
          }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ values, setFieldValue }) => (
            <Form className="space-y-5 flex flex-col">

              <FormInput label="USER NAME" name="username" type="text" />

              <FormInput label="EMAIL ADDRESS" name="email" type="email" />

              <FormInput label="PASSWORD" name="password" type="password" />

              <div className="grid grid-cols-2 gap-4">
                <FormInput label="PHONE" name="phone" type="number" />
                <FormInput label="BATCH" name="batch" type="number" />
              </div>



              <div className="grid grid-cols-2 gap-4">
                {/* ROLE TYPE DROPDOWN */}
                <div>
                  <label className="text-[11px] text-[#8a8aa3] font-medium">ROLE TYPE</label>
                  <Select
                    className="w-full mt-1"
                    placeholder="Select role"
                    value={values.roleType || undefined}
                    onChange={(value) => setFieldValue("roleType", value)}
                    classNames={{ popup: { root: "role-dropdown" } }}
                  >
                    <Option value="Frontend">Frontend</Option>
                    <Option value="Backend">Backend</Option>
                    <Option value="Others">Others</Option>
                  </Select>
                </div>

                {/* SHOW ONLY IF OTHERS */}
                {values.roleType === "Others" && (
                  <FormInput
                    label="CUSTOM ROLE"
                    name="customRole"
                    type="text"
                  />
                )}
                <FormInput label="FEES" name="fees" type="number" />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-[14px] rounded-[12px] text-white text-[14px] font-semibold
                bg-gradient-to-r from-[#2563eb] to-[#3b82f6]
                shadow-[0_8px_30px_rgba(37,99,235,0.35)]
                hover:opacity-95 transition duration-200
                flex items-center justify-center gap-2"
              >
                <span className="flex h-6 w-[88px] items-center justify-center">
                  {loading ? <div className="loader-btn scale-75" /> : "Add User"}
                </span>
              </button>

              <Button
                onClick={() => navigate("/admin/user-dashboard")}
                type="link"
              >
                Back
              </Button>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default AddUser;