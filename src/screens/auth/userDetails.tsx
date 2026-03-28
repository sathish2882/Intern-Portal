import { useEffect, useState } from "react";
import { Formik, Form, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Input, Button } from "antd";
import { UserOutlined, MailOutlined } from "@ant-design/icons";
import students from "../../assets/images/png/student-illustration (2).png";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { getUserByIdApi, saveUserDetailsApi } from "../../services/authApi";
import { getUserId, isExamUser } from "../../utils/authCookies";

const inputClass =
  "!w-full !h-[46px] !rounded-xl !bg-transparent";

function UserDetails() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const userId = getUserId();

  const validationSchema = Yup.object({
    name: Yup.string()
      .required("Name is required")
      .min(3, "Minimum 3 characters"),
    email: Yup.string()
      .email("Invalid email format")
      .required("Email is required"),
  });

  const initialValues = {
    name: "",
    email: "",
  };

  return (
    <div className="h-screen flex items-center justify-center bg-[#e5e7eb]">
      <div className="flex w-[900px] h-[520px] rounded-2xl overflow-hidden shadow-[0_4px_14px_0_rgba(99,102,241,0.4)]">

        {/* LEFT */}
        <div className="w-1/2 bg-[#0f0f0f] flex flex-col justify-center px-12 py-10 text-white user-form">
          
          <h1 className="text-3xl font-bold mb-2">Student Details</h1>
          <p className="text-gray-400 mb-6">Enter your details</p>

          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={async (values) => {
              if (!userId) {
                toast.error("User not found. Please login again.");
                navigate("/login");
                return;
              }

              try {
                setLoading(true);
                await saveUserDetailsApi(userId as string, values);
                toast.success("Details saved successfully");
                navigate("/user/dashboard", { replace: true });
              } catch (error: any) {
                const message =
                  error?.response?.data?.detail || "Failed to save details";
                toast.error(message);
              } finally {
                setLoading(false);
              }
            }}
          >
            {({ handleSubmit, handleChange, values, setValues }) => {

              useEffect(() => {
                const loadUser = async () => {
                  if (!isExamUser() || !userId) {
                    navigate("/login", { replace: true });
                    return;
                  }

                  try {
                    const response = await getUserByIdApi(userId as string);
                    const payload = response?.data ?? {};

                    setValues({
                      name: String(payload.name ?? payload.username ?? ""),
                      email: String(payload.email ?? ""),
                    });
                  } catch (error) {
                    console.error(error);
                  }
                };

                loadUser();
              }, []);

              return (
                <Form onSubmit={handleSubmit} className="space-y-5">

                  {/* NAME */}
                  <div>
                    <Input
                      size="large"
                      name="name"
                      placeholder="Username / Name"
                      prefix={<UserOutlined />}
                      value={values.name}
                      onChange={handleChange}
                      className={inputClass}
                    />
                    <p className="text-red-400 text-xs mt-1">
                      <ErrorMessage name="name" />
                    </p>
                  </div>

                  {/* EMAIL */}
                  <div>
                    <Input
                      size="large"
                      name="email"
                      placeholder="Email"
                      prefix={<MailOutlined />}
                      value={values.email}
                      onChange={handleChange}
                      className={inputClass}
                    />
                    <p className="text-red-400 text-xs mt-1">
                      <ErrorMessage name="email" />
                    </p>
                  </div>

                  {/* BUTTON */}
                  <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    loading={loading}
                    className="w-full h-[46px] rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 border-none"
                  >
                    Submit
                  </Button>

                </Form>
              );
            }}
          </Formik>
        </div>

        {/* RIGHT */}
        <img
          src={students}
          alt="student"
          className="w-1/2 h-full object-cover"
        />
      </div>
    </div>
  );
}

export default UserDetails;