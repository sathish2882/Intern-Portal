import React, { useRef } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";

const UserDetails: React.FC = () => {
    const nameRef = useRef<HTMLInputElement>(null);
    const emailRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate()

    const formik = useFormik({
        initialValues: {
            name: "",
            email: "",
        },
        validationSchema: Yup.object({
            name: Yup.string().required("Name is required"),
            email: Yup.string()
                .email("Please enter a valid email")
                .required("Email is required"),
        }),
        onSubmit: (values) => {
            console.log("Login attempt:", values);
            navigate("/user/dashboard")
        },
    });

    // Focus first error field
    const handleFocus = () => {
        if (formik.errors.name) {
            nameRef.current?.focus();
        } else if (formik.errors.email) {
            emailRef.current?.focus();
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
                <h1 className="text-2xl font-bold text-center mb-6">User Details</h1>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        formik.handleSubmit();
                        handleFocus();
                    }}
                    className="space-y-4"
                >
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Name/Username</label>
                        <input
                            ref={nameRef}
                            type="text"
                            {...formik.getFieldProps("name")}
                            placeholder="Enter your name"
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${formik.touched.name && formik.errors.name
                                ? "border-red-500 focus:ring-red-400"
                                : "border-gray-300 focus:ring-blue-400"
                                }`}
                        />
                        {formik.touched.name && formik.errors.name && (
                            <p className="text-red-500 text-sm mt-1">
                                {formik.errors.name}
                            </p>
                        )}
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input
                            ref={emailRef}
                            type="email"
                            {...formik.getFieldProps("email")}
                            placeholder="Enter your email"
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${formik.touched.email && formik.errors.email
                                ? "border-red-500 focus:ring-red-400"
                                : "border-gray-300 focus:ring-blue-400"
                                }`}
                        />
                        {formik.touched.email && formik.errors.email && (
                            <p className="text-red-500 text-sm mt-1">
                                {formik.errors.email}
                            </p>
                        )}
                    </div>
                   
                    {/* Button */}
                    <div className="flex w-full justify-center">
                        <button
                        type="submit"
                        className="w-1/2 bg-blue-500 text-black py-2 rounded-lg 
                        border border-blue hover:bg-blue hover:text-white transition duration-200"
                    >
                        Submit
                    </button>
                    </div>
                    
                </form>
            </div>
        </div>
    );
};

export default UserDetails;