{/*import { Navigate } from "react-router-dom";
import Cookies from "js-cookie";
import { useAppSelector } from "../../redux/hooks";

const ProtectedRoute = ({ children, role }: any) => {
  const { user } = useAppSelector((s) => s.auth);

  const token = Cookies.get("token");
  const userTypeFromCookie = Cookies.get("userType");

  // No token → not logged in
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Role mismatch (check both Redux + cookie)
  if (
    role &&
    user &&
    user.user_type !== role &&
    userTypeFromCookie !== role
  ) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;*/}
