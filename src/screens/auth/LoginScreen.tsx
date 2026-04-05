import { useNavigate } from "react-router-dom";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useState } from "react";
import { toast } from "react-toastify";
import { loginApi } from "../../services/authApi";
import {
  removeToken,
  removeUserId,
  setToken,
  setUser,
  setUserId,
} from "../../utils/authCookies";
import { WelcomeImg } from "../../utils/Images";
import FormInput from "../../components/form/FormInput";
import Footer from "../../components/footer/Footer";

interface FormValues {
  identifier: string;
  password: string;
}

interface LoginResponse {
  token?: string;
  access_token?: string;
  user_id?: number | string;
  user_type?: number | string;
  type?: number | string;
  data?: {
    token?: string;
    access_token?: string;
    user_id?: number | string;
    user_type?: number | string;
    type?: number | string;
  };
}

const getRedirectByUserType = (userType: number) => {
  if (userType === 1) return "/admin/portals";
  if (userType === 2) return "/intern/dashboard";
  if (userType === 4) return "/mentor/dashboard";
  return "/user/userDetails";
};

const getAuthData = (responseData: LoginResponse) => {
  const token =
    responseData?.token ??
    responseData?.access_token ??
    responseData?.data?.token ??
    responseData?.data?.access_token;

  const rawUserId = responseData?.user_id ?? responseData?.data?.user_id;

  const rawUserType =
    responseData?.user_type ??
    responseData?.type ??
    responseData?.data?.user_type ??
    responseData?.data?.type;

  return {
    token,
    userId: rawUserId ? Number(rawUserId) : NaN,
    userType: rawUserType ? Number(rawUserType) : NaN,
  };
};

const LoginScreen = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const validationSchema = Yup.object({
    identifier: Yup.string()
      .required("Email or Username is required")
      .test("email-or-username", "Enter a valid email or username", (value) => {
        if (!value) return false;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const usernameRegex = /^[a-zA-Z0-9_.]{3,20}$/;

        return emailRegex.test(value) || usernameRegex.test(value);
      }),
    password: Yup.string().required("Password is required"),
  });

  const handleSubmit = async (values: FormValues) => {
    try {
      setLoading(true);

      const payload = {
        email: values.identifier,
        username: values.identifier,
        login: values.identifier,
        password: values.password,
      };

      const response = await loginApi(payload);
      const { token, userId, userType } = getAuthData(response?.data ?? {});

      // 🟢 NORMAL USER
      if (token) {
        removeUserId();

        setToken(token);
        setUser(String(userType));

        toast.success("Login successful");
        navigate(getRedirectByUserType(userType), { replace: true });
        return;
      }

      // 🔵 EXAM USER
      if (userId) {
        removeToken();

        setUserId(String(userId));
        setUser("3");

        toast.success("Exam login successful");
        navigate("/user/userDetails", { replace: true });
        return;
      }

      toast.error("Invalid login response");
    } catch (error: any) {
      const message = error?.response?.data?.detail || "Invalid credentials";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#5192d4] to-[#eef2ff] flex flex-col font-body">
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div
          className="
              w-full max-w-[90%] sm:max-w-[420px] md:max-w-[440px]
              bg-white 
              rounded-[24px] 
              border border-[#e2e8f0] 
              shadow-[0_8px_40px_rgba(124,58,237,0.12),0_2px_8px_rgba(76,29,149,0.06)]
              my-6 sm:my-10 
              p-6 sm:p-8 md:p-10
              mx-auto
              "
        >
          <div className="text-center">
            <div
              className="
                mx-auto mb-6 flex 
                items-center justify-center 
                h-[80px] w-[80px] 
                sm:h-[100px] sm:w-[100px]
                rounded-[22px] bg-white shadow-md
              "
            >
              <img
                src={WelcomeImg}
                alt="logo"
                className="h-[50px] w-[50px] sm:h-[70px] sm:w-[70px] object-contain"
              />
            </div>

            <p className="text-[11px] tracking-[3px] uppercase text-[#1e3a8a] font-semibold mb-3">
              INTERNSHIP PORTAL
            </p>

            <h1 className="font-heading text-[30px] font-bold text-[#0f172a] mb-2 leading-[1.3]">
              Welcome to M-Guru
            </h1>

            <p className="text-[14px] text-[#64748b] mb-4">
              by{" "}
              <span className="text-[#4c1d95] font-semibold">
                Velava Foundation
              </span>
            </p>

            <div className="w-[60px] h-[2px] bg-gradient-to-r from-[#1e3a8a] to-[#4c1d95] rounded mb-8 mx-auto" />
          </div>

          <Formik
            initialValues={{ identifier: "", password: "" }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {() => (
              <Form className="w-full space-y-4">
                <FormInput
                  label="EMAIL OR USERNAME"
                  name="identifier"
                  type="text"
                  placeholder="Email or username"
                />

                <FormInput
                  label="PASSWORD"
                  name="password"
                  type="password"
                  placeholder="Password"
                />

                <div className="flex justify-center pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="
                  w-full sm:w-[180px]
                  py-[14px] sm:py-[16px]
                  bg-gradient-to-br from-[#1e3a8a] to-[#4c1d95]
                  text-white text-[14px] font-semibold uppercase tracking-[1.5px]
                  rounded-[12px]
                  shadow-[0_6px_20px_rgba(30,58,138,0.25)]
                  hover:-translate-y-[2px] hover:shadow-[0_10px_30px_rgba(30,58,138,0.35)]
                  active:scale-[0.97]
                  transition duration-200
                  disabled:opacity-70
                  "
                  >
                    <span className="flex h-6 items-center justify-center">
                      {loading ? (
                        <div className="loader-btn loader-btn-sm" />
                      ) : (
                        "Login"
                      )}
                    </span>
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default LoginScreen;
