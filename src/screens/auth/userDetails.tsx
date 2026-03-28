import React from "react";
import { Formik, Form, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Input, Button } from "antd";
import { UserOutlined, MailOutlined } from "@ant-design/icons";
import students from "../../assets/images/png/student-illustration (2).png";
import { useNavigate } from "react-router-dom";

const UserDetails: React.FC = () => {
    const navigate = useNavigate()
  // ✅ Validation Schema
  const validationSchema = Yup.object({
    username: Yup.string()
      .required("Username or Name is required")
      .min(3, "Minimum 3 characters"),
    email: Yup.string()
      .email("Invalid email format")
      .required("Email is required"),
  });

  // ✅ Initial Values
  const initialValues = {
    username: "",
    email: "",
  };

  // ✅ Submit Handler
  const handleSubmit = (values: typeof initialValues) => {
    console.log("Form Values:", values);
     navigate("/user/dashboard")
  };

  return (
    <div className="h-screen flex items-center justify-center bg-[#e5e7eb]">
      
      {/* MAIN CARD */}
      <div className="flex w-[900px] h-[520px] rounded-2xl overflow-hidden shadow-[0_4px_14px_0_rgba(99,102,241,0.4)]">
        
        {/* LEFT SIDE */}
        <div className="w-1/2 bg-[#0f0f0f] flex flex-col justify-center px-12 text-white">
          <h1 className="text-3xl font-bold mb-2">Student Details</h1>
          <p className="text-gray-400 mb-8">Enter your details</p>

          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ handleSubmit, handleChange, values }) => (
              <Form onSubmit={handleSubmit} className="space-y-5">
                
                {/* USERNAME */}
                <div>
                  <Input
                    size="large"
                    name="username"
                    placeholder="Username / Name"
                    prefix={<UserOutlined />}
                    value={values.username}
                    onChange={handleChange}
                  />
                  <p className="text-red-500 text-sm mt-1">
                    <ErrorMessage name="username" />
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
                  />
                  <p className="text-red-500 text-sm mt-1">
                    <ErrorMessage name="email" />
                  </p>
                </div>

                {/* BUTTON */}
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 border-none"
                >
                  Submit
                </Button>
              </Form>
            )}
          </Formik>
        </div>

        {/* RIGHT SIDE */}
            <img
              src={students}
              alt="student"
              className="w-1/2 h-full object-cover"
            />
      </div>
    </div>
  );
};

export default UserDetails;