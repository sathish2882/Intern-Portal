import { Navigate } from "react-router-dom";

const WelcomeScreen = () => {
  return <Navigate to="/login" replace />;
};

export default WelcomeScreen;
