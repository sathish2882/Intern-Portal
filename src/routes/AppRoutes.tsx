import { Routes, Route, Navigate } from "react-router-dom";
import { useAppSelector } from "../redux/hooks";

//import ProtectedRoute from "../components/ui/ProtectedRoute";

import LoginScreen from "../screens/auth/LoginScreen";
import InternPortal from "../screens/intern/InternPortal";

import AdminLayout from "../components/layout/AdminLayout";
import AdminDashboard from "../screens/admin/AdminDashboard";
import SendEmail from "../screens/admin/SendEmail";
import Customers from "../screens/admin/Customers";
import EmailHistory from "../screens/admin/EmailHistory";

import UserLayout from "../components/layout/UserLayout";
import UserDashboard from "../screens/user/UserDashboard";
import TestPage from "../screens/user/TestPage";
import ResultPage from "../screens/user/ResultPage";
import WelcomeScreen from "../screens/auth/WelcomeScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";

const AppRoutes = () => {
  const { user } = useAppSelector((s) => s.auth);

  const defaultRoute = () => {
    if (!user) return "/login";
    return user.user_type === "admin" ? "/admin/dashboard" : "/user/dashboard";
  };

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<WelcomeScreen />} />
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/register" element={<RegisterScreen />} />

      {/* Intern registration — public multi-step form */}
      <Route path="/intern" element={<InternPortal />} />

      {/* Admin */}
      <Route
        path="/admin"
        element={
          //<ProtectedRoute allowedRole="admin">
            <AdminLayout />
          //</ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="send-email" element={<SendEmail />} />
        <Route path="customers" element={<Customers />} />
        <Route path="email-history" element={<EmailHistory />} />
      </Route>

      {/* User */}
      <Route
        path="/user"
        element={
          //<ProtectedRoute allowedRole="user">
            <UserLayout />
          //</ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<UserDashboard />} />
        <Route path="test" element={<TestPage />} />
        <Route path="result" element={<ResultPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to={defaultRoute()} replace />} />
    </Routes>
  );
};

export default AppRoutes;
