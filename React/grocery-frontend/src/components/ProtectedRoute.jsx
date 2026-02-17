import { Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import Loader from "./common/Loader";

export default function ProtectedRoute({ children, roles = [] }) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return <Loader label="Checking session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  if (roles.length > 0) {
    const currentRole = (user?.role || "").toUpperCase();
    const allowed = roles.map((role) => role.toUpperCase());
    if (!allowed.includes(currentRole)) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}
