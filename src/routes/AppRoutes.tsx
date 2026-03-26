import { createHashRouter, Navigate } from "react-router-dom";
import { store } from "../redux/store";

// Route Guard
//import ProtectedRoute from "../components/ui/ProtectedRoute";

// Auth
import WelcomeScreen from "../screens/auth/WelcomeScreen";
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import OtpScreen from "../screens/auth/OtpScreen";



// Admin
import AdminLayout from "../components/layout/AdminLayout";
import AdminDashboard from "../screens/admin/AdminDashboard";
import SendEmail from "../screens/admin/SendEmail";
import Customers from "../screens/admin/Customers";
import EmailHistory from "../screens/admin/EmailHistory";

// User
import UserLayout from "../components/layout/UserLayout";
import UserDashboard from "../screens/user/UserDashboard";
import TestPage from "../screens/user/TestPage";
import ResultPage from "../screens/user/ResultPage";

const getDefaultRoute = () => {
  const { user } = store.getState().auth;

  if (!user) return "/login";
  return user.user_type === "admin"
    ? "/admin/dashboard"
    : "/user/dashboard";
};

export const router = createHashRouter([
  // 🌍 PUBLIC
  { path: "/", element: <WelcomeScreen /> },
  { path: "/login", element: <LoginScreen /> },
  { path: "/register", element: <RegisterScreen /> },
  { path: "/otp", element: <OtpScreen /> },

  // 🔐 ADMIN
  {
    path: "/admin",
    element: (
      //<ProtectedRoute role="admin">
        <AdminLayout />
      //</ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: "dashboard", element: <AdminDashboard /> },
      { path: "send-email", element: <SendEmail /> },
      { path: "customers", element: <Customers /> },
      { path: "email-history", element: <EmailHistory /> },
    ],
  },

  // 👤 USER
  {
    path: "/user",
    element: (
      //<ProtectedRoute role="user">
        <UserLayout />
      //</ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: "dashboard", element: <UserDashboard /> },
      { path: "test", element: <TestPage /> },
      { path: "result", element: <ResultPage /> },
    ],
  },

  // 🔁 FALLBACK
  {
    path: "*",
    element: <Navigate to={getDefaultRoute()} replace />,
  },
]);