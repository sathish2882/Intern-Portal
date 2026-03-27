import { createHashRouter, Navigate, Outlet } from "react-router-dom";

// Auth
import WelcomeScreen from "../screens/auth/WelcomeScreen";
import LoginScreen from "../screens/auth/LoginScreen";
import AddUser from "../screens/auth/AddUser";
import OtpScreen from "../screens/auth/OtpScreen";

// Admin
import AdminLayout from "../components/layout/AdminLayout";
import AdminPortalSelector from "../screens/admin/AdminPortalSelector";
import AdminUserDashboard from "../screens/admin/AdminUserDashboard";
import UserAttendanceDashboard from "../screens/admin/UserAttendanceDashboard";
import UserExamMarksDashboard from "../screens/admin/UserExamMarksDashboard";
import AdminDashboard from "../screens/admin/AdminDashboard";
import SendEmail from "../screens/admin/SendEmail";
import Customers from "../screens/admin/Customers";
import EmailHistory from "../screens/admin/EmailHistory";

// Intern
import InternLayout from "../components/layout/InternLayout";
import InternDashboard from "../screens/intern/InternDashboard";

// User
import UserLayout from "../components/layout/UserLayout";
import UserDashboard from "../screens/user/UserDashboard";
import TestPage from "../screens/user/TestPage";
import ResultPage from "../screens/user/ResultPage";
import ProtectedRoute from "../components/ui/ProtectedRoute";
import UserDetails from "../screens/auth/userDetails";

export const router = createHashRouter([
  {
    path: "/",
    element: (
      <ProtectedRoute guestOnly>
        <WelcomeScreen />
      </ProtectedRoute>
    ),
  },
  {
    path: "/login",
    element: (
      <ProtectedRoute guestOnly>
        <LoginScreen />
      </ProtectedRoute>
    ),
  },
  { path: "/register", element: <AddUser /> },
  { path: "/add-user", element: <AddUser /> },
  { path: "/otp", element: <OtpScreen /> },

  {
    path: "/admin",
    element: (
      <ProtectedRoute role="1">
        <Outlet />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="portals" replace /> },
      { path: "portals", element: <AdminPortalSelector /> },
      { path: "user-dashboard", element: <AdminUserDashboard /> },
      { path: "attendance-dashboard", element: <UserAttendanceDashboard /> },
      { path: "exam-dashboard", element: <UserExamMarksDashboard /> },
      {
        path: "payment",
        element: <AdminLayout />,
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          { path: "dashboard", element: <AdminDashboard /> },
          { path: "send-email", element: <SendEmail /> },
          { path: "users", element: <Customers /> },
          { path: "email-history", element: <EmailHistory /> },
        ],
      },
    ],
  },

  {
    path: "/intern",
    element: (
      <ProtectedRoute role="2">
        <InternLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: "dashboard", element: <InternDashboard /> },
    ],
  },

  {
    path: "/user",
    element: (
      <ProtectedRoute role="3">
        <UserLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: "dashboard", element: <UserDashboard /> },
      { path: "test", element: <TestPage /> },
      { path: "result", element: <ResultPage /> },
      { path:"userDetails", element:<UserDetails/>}
      
    ],
  },

  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);
