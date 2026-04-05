import {
  createHashRouter,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";
import { useEffect } from "react";

// ScrollToTop wrapper
const ScrollToTopOutlet = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return <Outlet />;
};
import WelcomeScreen from "../screens/auth/WelcomeScreen";
import LoginScreen from "../screens/auth/LoginScreen";
import AddUser from "../screens/auth/AddAndEditUser";
import NotFound from "../screens/NotFound";

// Admin
import AdminLayout from "../components/layout/AdminLayout";
import AdminPortalSelector from "../screens/admin/AdminPortalSelector";
import AdminInternDashboard from "../screens/admin/AdminInternDashboard";
import AdminMentorDashboard from "../screens/admin/AdminMentorDashboard";
import UserAttendanceDashboard from "../screens/admin/UserAttendanceDashboard";
import InterviewDashboard from "../screens/admin/AssesmentDashboard";
import AdminDashboard from "../screens/admin/AdminDashboard";
import SendEmail from "../screens/admin/SendEmail";
import Customers from "../screens/admin/User";
import EmailHistory from "../screens/admin/EmailHistory";
import AdminFeedback from "../screens/admin/AdminFeedback";

// Intern
import InternLayout from "../components/layout/InternLayout";
import InternDashboard from "../screens/intern/InternDashboard";
import TasksPage from "../screens/intern/TasksPage";
import MessagesPage from "../screens/intern/MessagesPage";
import CalendarPage from "../screens/intern/CalendarPage";
import InternFeedback from "../screens/intern/InternFeedback";

// User
import UserLayout from "../components/layout/UserLayout";
import UserDashboard from "../screens/user/UserDashboard";
import TestPage from "../screens/user/TestPage";
import ResultPage from "../screens/user/ResultPage";
import ProtectedRoute from "../components/ui/ProtectedRoute";
import UserDetails from "../screens/auth/userDetails";
import CodingTest from "../screens/user/CodingTestPage";

// Mentor
import MentorLayout from "../components/layout/MentorLayout";
import MentorDashboard from "../screens/mentor/MentorDashboard";
import TechnicalAssessment from "../screens/mentor/TechnicalAssessment";
import PresentationAssessment from "../screens/mentor/PresentationAssessment";
import SoftSkillsAssessment from "../screens/mentor/SoftSkillsAssessment";

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
  { path: "/add-user", element: <AddUser /> },
  { path: "/edit-user", element: <AddUser /> },

  {
    path: "/admin",
    element: (
      <ProtectedRoute role="1">
        <ScrollToTopOutlet />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="portals" replace /> },
      { path: "portals", element: <AdminPortalSelector /> },
      { path: "mentor-dashboard", element: <AdminMentorDashboard /> },
      { path: "intern-dashboard", element: <AdminInternDashboard /> },
      { path: "attendance-dashboard", element: <UserAttendanceDashboard /> },
      { path: "interview-dashboard", element: <InterviewDashboard /> },
      { path: "feedback", element: <AdminFeedback /> },
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
      { path: "tasks", element: <TasksPage /> },
      { path: "messages", element: <MessagesPage /> },
      { path: "calendar", element: <CalendarPage /> },
      { path: "feedback", element: <InternFeedback /> },
    ],
  },

  {
    path: "/user",
    element: (
      <ProtectedRoute role="3">
        <UserLayout key={window.location.pathname} />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: "dashboard", element: <UserDashboard /> },
      { path: "test", element: <TestPage /> },
      { path: "result", element: <ResultPage /> },
      { path: "coding-test", element: <CodingTest /> },
      {
        path: "userDetails",
        element: <UserDetails />,
      },
    ],
  },

  {
    path: "/mentor",
    element: (
      <ProtectedRoute role="4">
        <MentorLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: "dashboard", element: <MentorDashboard /> },
      { path: "technical", element: <TechnicalAssessment /> },
      { path: "presentation", element: <PresentationAssessment /> },
      { path: "softskills", element: <SoftSkillsAssessment /> },
    ],
  },

  {
    path: "*",
    element: <NotFound />,
  },
]);
