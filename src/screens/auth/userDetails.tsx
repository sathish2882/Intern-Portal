import { useEffect, useState } from "react";
import { Formik, Form, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Input, Button } from "antd";
import intern from "../../assets/images/png/intern-illustration.png";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { getUserByIdApi, saveUserDetailsApi } from "../../services/authApi";
import { getUserId, isExamUser } from "../../utils/authCookies";

function UserDetails() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const userId = getUserId();

  const [initialValues, setInitialValues] = useState({
    name: "",
    email: "",
  });

  const validationSchema = Yup.object({
    name: Yup.string().required("Name is required").min(3),
    email: Yup.string().email().required("Email is required"),
  });

  useEffect(() => {
    const loadUser = async () => {
      if (!isExamUser() || !userId) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        const response = await getUserByIdApi(userId as string);
        const payload = response?.data ?? {};

        setInitialValues({
          name: String(payload.name ?? ""),
          email: String(payload.email ?? ""),
        });
      } catch (error: any) {
        console.error(error);
        toast.error(error?.response?.data?.detail || "Failed to load user details");
      }
    };

    loadUser();
  }, []);

  // Block browser back button — keep user on this page until form is submitted
  useEffect(() => {
    window.history.pushState(null, "", window.location.href);

    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 p-4">
      <div className="flex flex-col md:flex-row w-full max-w-[900px] md:h-[540px] rounded-2xl overflow-hidden shadow-2xl hover:shadow-[0_25px_50px_rgba(0,0,0,0.15)] transition-all duration-300">
        {/* LEFT */}
        <div className="w-full md:w-1/2 bg-gradient-to-br from-[#0f0f0f] to-[#1a1a1a] flex flex-col justify-center px-6 sm:px-12 py-8 sm:py-10 text-white user-form">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-3">
              User Details
            </h1>
            <div className="h-1 w-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mb-3"></div>
            <p className="text-gray-400 text-sm">
              Complete your profile to continue
            </p>
          </div>

          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            enableReinitialize
            onSubmit={async (values) => {
              if (!userId) {
                toast.error("User not found");
                navigate("/login");
                return;
              }

              try {
                setLoading(true);
                await saveUserDetailsApi(userId as string, values);
                toast.success("Saved successfully");
                navigate("/user/dashboard");
              } catch (error: any) {
                toast.error(error?.response?.data?.detail || "Error");
              } finally {
                setLoading(false);
              }
            }}
          >
            {({ handleSubmit, handleChange, values }) => (
              <Form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {/* NAME */}
                <div>
                  <label className="block text-xs text-gray-300 font-semibold mb-2.5 uppercase tracking-wide">
                    Your Name
                  </label>
                  <Input
                    name="name"
                    placeholder="Enter your full name"
                    value={values.name}
                    onChange={handleChange}
                    size="large"
                  />
                  <p className="text-red-400 text-xs mt-2 min-h-[16px] font-medium">
                    <ErrorMessage name="name" />
                  </p>
                </div>

                {/* EMAIL */}
                <div>
                  <label className="block text-xs text-gray-300 font-semibold mb-2.5 uppercase tracking-wide">
                    Email Address
                  </label>
                  <Input
                    name="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={values.email}
                    onChange={handleChange}
                    size="large"
                  />
                  <p className="text-red-400 text-xs mt-2 min-h-[16px] font-medium">
                    <ErrorMessage name="email" />
                  </p>
                </div>

                {/* BUTTON */}
                <Button
                  htmlType="submit"
                  loading={loading}
                  type="primary"
                  size="large"
                  className="w-full h-[46px] mt-6 sm:mt-8 bg-gradient-to-r from-indigo-500 to-purple-500 border-none font-semibold rounded-lg"
                >
                  {loading ? "Saving..." : "Continue to Dashboard"}
                </Button>
              </Form>
            )}
          </Formik>
        </div>

        {/* RIGHT */}
        <img
          src={intern}
          alt="student illustration"
          className="hidden md:block w-full md:w-1/2 h-48 md:h-full object-cover"
        />
      </div>
    </div>
  );
}

export default UserDetails;
