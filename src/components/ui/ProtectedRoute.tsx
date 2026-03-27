 import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { getToken, getUserType } from "../../utils/authCookies";

interface ProtectedRouteProps {
  children: ReactNode;
  role?: string;
  guestOnly?: boolean;
}

const getRedirectByUserType = (userType?: string) => {
  if (userType === "1") return "/admin/portals";
  if (userType === "2") return "/intern/dashboard";
  if (userType === "3") return "/user/dashboard";
  return "/";
};

const ProtectedRoute = ({
  children,
  role,
  guestOnly = false,
}: ProtectedRouteProps) => {
  const token = getToken();
  const userType = getUserType();
  const isLoggedIn = Boolean(token);

  if (guestOnly) {
    return isLoggedIn ? (
      <Navigate to={getRedirectByUserType(userType)} replace />
    ) : (
      <>{children}</>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (role && userType !== role) {
    return <Navigate to={getRedirectByUserType(userType)} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute; 
 