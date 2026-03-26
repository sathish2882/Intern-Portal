import { Formik, Form } from "formik";
import { Link, useNavigate } from "react-router-dom";
import * as Yup from "yup";
import { useState } from "react";
import { toast } from "react-toastify";
import FormInput from "../../components/form/FormInput";

interface SignupFormValues {
  username: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

const RegisterScreen = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validationSchema = Yup.object({
    username: Yup.string().required("Enter your name"),
    email: Yup.string().email("Invalid email").required("Enter email"),
    phone: Yup.string().required("Enter phone number"),
    password: Yup.string()
      .min(6, "Min 6 characters")
      .required("Enter password"),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("password")], "Passwords must match")
      .required("Confirm password"),
  });

  const handleSubmit = async (values: SignupFormValues) => {
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("username", values.username);
      formData.append("email", values.email);
      formData.append("phone", values.phone);
      formData.append("password", values.password);

      toast.success("Signup successful 🚀");
      navigate("/login", { replace: true });
    } catch (error: any) {
      const message = error?.response?.data?.detail || "Something went wrong";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-10 relative bg-[#f1f5f9] overflow-hidden flex items-center justify-center font-body px-4">

      {/* BACKGROUND */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#f8fbff] via-[#f1f5f9] to-[#e2e8f0]" />
      <div className="absolute top-[-80px] left-[-80px] h-[240px] w-[240px] rounded-full bg-sky-200/40 blur-[80px]" />
      <div className="absolute bottom-[-100px] right-[-60px] h-[280px] w-[280px] rounded-full bg-blue-200/40 blur-[90px]" />

      {/* CARD */}
      <div className="relative z-10 w-full max-w-[520px] rounded-[20px] px-10 py-9 
        bg-white/95 backdrop-blur-xl
        border border-slate-200
        shadow-[0_20px_60px_rgba(15,23,42,0.12)]">

        {/* TITLE */}
        <h2 className="text-[26px] font-heading font-semibold text-slate-900 mb-1">
          Create Your <span className="text-[#2563eb]">Account</span>
        </h2>

        <p className="text-slate-500 text-[13px] mb-7 leading-relaxed">
          Register to start your internship journey. A one-time password will be sent to your email.
        </p>

        {/* FORM */}
        <Formik
          initialValues={{
            username: "",
            email: "",
            phone: "",
            password: "",
            confirmPassword: "",
          }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {() => (
            <Form className="space-y-5">

              <FormInput label="FULL NAME" name="username" type="text" />

              <FormInput label="EMAIL ADDRESS" name="email" type="email" />

              <FormInput label="PHONE NUMBER" name="phone" type="text" />

              {/* PASSWORD */}
              <div>
                <FormInput
                  label="CREATE PASSWORD"
                  name="password"
                  type="password"
                />

                {/* STRENGTH LINE */}
                <div className="flex gap-2 mt-3">
                  {[1, 2, 3, 4].map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 h-[2px] bg-slate-200 rounded"
                    />
                  ))}
                </div>
              </div>

              <FormInput
                label="CONFIRM PASSWORD"
                name="confirmPassword"
                type="password"
              />

              {/* BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-[14px] rounded-[12px] text-white text-[14px] font-semibold
                bg-gradient-to-r from-[#2563eb] to-[#3b82f6]
                shadow-[0_8px_30px_rgba(37,99,235,0.35)]
                hover:opacity-95 transition duration-200
                flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="loader-btn" />
                ) : (
                  "Send OTP to Email →"
                )}
              </button>

            </Form>
          )}
        </Formik>

        {/* FOOTER */}
        <p className="text-center text-[12px] text-slate-500 mt-5">
          Already registered?{" "}
          <Link to="/login" className="text-[#2563eb] hover:underline">
            Login here
          </Link>
        </p>

      </div>
    </div>
  );
};

export default RegisterScreen;
