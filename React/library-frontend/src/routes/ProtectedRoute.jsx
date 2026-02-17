import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import LoadingState from "../components/common/LoadingState";

function ProtectedRoute({ allowedRoles }) {
  const location = useLocation();
  const { isLoading, isAuthenticated, role } = useAuth();

  if (isLoading) {
    return <LoadingState label="Checking session" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles?.length && !allowedRoles.includes(role)) {
    return <Navigate to={role === "LIBRARIAN" ? "/librarian" : "/member"} replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
