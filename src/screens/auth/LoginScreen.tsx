import { useNavigate } from "react-router-dom";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useState } from "react";
import { toast } from "react-toastify";
import { loginApi } from "../../services/authApi";
import { setToken } from "../../utils/authCookies";
import image from "../../assets/images/png/loginplaceholder1.png"

interface FormValues {
  email: string;
}

const LoginScreen = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  /* ✅ Validation */
  const validationSchema = Yup.object({
    email: Yup.string().email("Invalid email").required("Email is required"),
  });

  /* ✅ Submit */
  const handleSubmit = async (values: FormValues) => {
    try {
      setLoading(true);

      const formdata = new FormData();
      formdata.append("email", values.email);
      
      const response = await loginApi(formdata)
      if(response.data.token){
        setToken(response.data.token)
        
        navigate("/dashboard")
      }
      
    } catch (error: any) {
      const message = error?.response?.data?.detail || "Something went wrong";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex flex-col items-center justify-center font-body px-4">
      {/* ICON */}
      <div>
        <img src={image} alt="placeholder-img" className="h-44 w-44"/>
      </div>

      {/* TITLE */}
      <p className="text-[11px] tracking-[2px] text-gray-400 mb-6 font-body">
        INTERNSHIP PORTAL
      </p>

      <p className="text-sm text-gray-500 mb-3 font-body">
        Enter your registered email
      </p>

      {/* FORM */}
      <Formik
        initialValues={{ email: "" }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ values, handleChange, errors, touched }) => (
          <Form className="w-full max-w-[360px]">
            {/* INPUT BOX */}
            <div
              className={`flex items-center border-2 rounded-[12px] bg-white overflow-hidden transition-all duration-200
  focus-within:border-blue-500 focus-within:shadow-[0_0_0_2px_rgba(59,130,246,0.2)]
  ${
    errors.email && touched.email
      ? "border-red-400 focus-within:border-red-500 focus-within:shadow-[0_0_0_2px_rgba(248,113,113,0.2)]"
      : "border-[#3b82f6]"
  }`}
            >
              <input
                name="email"
                value={values.email}
                onChange={handleChange}
                placeholder="Email address"
                className="flex-1 px-4 py-3 text-sm outline-none font-body bg-transparent"
              />

              <button
                type="submit"
                disabled={loading}
                className="px-4 py-3 text-[#3b82f6] text-xl flex items-center justify-center transition hover:scale-110"
              >
                {loading ? <div className="loader-btn" /> : "→"}
              </button>
            </div>

            {/* ERROR */}
            {errors.email && touched.email && (
              <p className="text-red-500 text-xs mt-1 font-body">
                {errors.email}
              </p>
            )}
          </Form>
        )}
      </Formik>

      {/* DIVIDER */}
      <div className="flex items-center gap-4 my-6 w-full max-w-[360px]">
        <div className="flex-1 h-[1px] bg-gray-300" />
        <span className="text-xs text-gray-400 font-body">OR</span>
        <div className="flex-1 h-[1px] bg-gray-300" />
      </div>

      {/* NAVIGATION */}
      <p
        onClick={() => navigate("/")}
        className="text-sm text-gray-500 cursor-pointer mb-2 hover:underline font-body"
      >
        ← Back to Home
      </p>

      <p className="text-sm text-gray-500 font-body">
        Don't have an account?{" "}
        <span
          onClick={() => navigate("/register")}
          className="text-blue-600 cursor-pointer font-medium hover:underline"
        >
          Register Now
        </span>
      </p>
    </div>
  );
};

export default LoginScreen;
