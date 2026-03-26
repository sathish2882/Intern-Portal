import { useNavigate } from "react-router-dom";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useState } from "react";
import { toast } from "react-toastify";
import { loginApi } from "../../services/authApi";
import { setToken, setUser } from "../../utils/authCookies";
import image from "../../assets/images/png/loginplaceholder1.png";

interface FormValues {
  email: string;
  password: string;
}

interface LoginResponse {
  token?: string;
  access_token?: string;
  user_type?: number | string;
  type?: number | string;
  data?: {
    token?: string;
    access_token?: string;
    user_type?: number | string;
    type?: number | string;
  };
}

const getRedirectByUserType = (userType: number) => {
  if (userType === 1) return "/admin/portals";
  if (userType === 2) return "/intern/dashboard";
  return "/user/dashboard";
};

const getAuthData = (responseData: LoginResponse) => {
  const token =
    responseData?.token ??
    responseData?.access_token ??
    responseData?.data?.token ??
    responseData?.data?.access_token;

  const rawUserType =
    responseData?.user_type ??
    responseData?.type ??
    responseData?.data?.user_type ??
    responseData?.data?.type;

  return {
    token,
    userType: Number(rawUserType),
  };
};

const LoginScreen = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const validationSchema = Yup.object({
    email: Yup.string().email("Invalid email").required("Email is required"),
    password: Yup.string().required("Password is required"),
  });

  const handleSubmit = async (values: FormValues) => {
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("email", values.email);
      formData.append("password", values.password);

      const response = await loginApi(formData);
      const { token, userType } = getAuthData(response?.data ?? {});

      if (token && !Number.isNaN(userType)) {
        setToken(token);
        setUser(String(userType));
        toast.success("Login successful");
        navigate(getRedirectByUserType(userType), { replace: true });
        return;
      }

      toast.error("Invalid login response");
    } catch (error: any) {
      const message =
        error?.response?.data?.detail || "Something went wrong";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 Production Input Wrapper
  const inputWrapperClass = (hasError: boolean) => `
    flex items-center rounded-[12px] bg-white overflow-hidden
    border transition-all duration-200 ease-in-out

    ${
      hasError
        ? "border-red-400 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-200"
        : "border-gray-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200"
    }

    hover:border-gray-400 focus-within:shadow-sm
  `;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#eef2ff] flex flex-col items-center justify-center px-4 font-sans">

      {/* Logo */}
      <img src={image} alt="logo" className="h-40 w-40 mb-4" />

      <p className="text-lg tracking-[2px] text-[blue] mb-6">
        M-Guru Portal
      </p>

      <p className="text-md text-gray-700 mb-4">
        Enter your registered credentials
      </p>

      <Formik
        initialValues={{ email: "", password: "" }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ values, handleChange, errors, touched }) => (
          <Form className="w-full max-w-[360px] space-y-4">

            {/* EMAIL */}
            <div>
              <div className={inputWrapperClass(!!(errors.email && touched.email))}>
                <input
                  name="email"
                  value={values.email}
                  onChange={handleChange}
                  placeholder="Email address"
                  className="
                    flex-1 px-4 py-3 text-sm bg-transparent
                    outline-none border-none
                    placeholder:text-gray-400
                  "
                />
              </div>

              {errors.email && touched.email && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.email}
                </p>
              )}
            </div>

            {/* PASSWORD */}
            <div>
              <div className={inputWrapperClass(!!(errors.password && touched.password))}>
                <input
                  name="password"
                  type="password"
                  value={values.password}
                  onChange={handleChange}
                  placeholder="Password"
                  className="
                    flex-1 px-4 py-3 text-sm bg-transparent
                    outline-none border-none
                    placeholder:text-gray-400
                  "
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="
                    px-4 py-3 text-blue-500 text-xl
                    flex items-center justify-center
                    transition-all duration-200
                    hover:scale-110 active:scale-95
                  "
                >
                  {loading ? (
                    <div className="loader-btn" />
                  ) : (
                    "→"
                  )}
                </button>
              </div>

              {errors.password && touched.password && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.password}
                </p>
              )}
            </div>

          </Form>
        )}
      </Formik>

      {/* Divider */}
      <div className="flex items-center gap-4 my-6 w-full max-w-[360px]">
        <div className="flex-1 h-[1px] bg-gray-300" />
        <span className="text-xs text-gray-400">OR</span>
        <div className="flex-1 h-[1px] bg-gray-300" />
      </div>

      {/* Back */}
      <p
        onClick={() => navigate("/")}
        className="text-sm text-gray-500 cursor-pointer hover:underline"
      >
        ← Back to Home
      </p>
    </div>
  );
};

export default LoginScreen;