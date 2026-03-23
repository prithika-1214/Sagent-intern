import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute({ allowedRoles = [] }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <Navigate
        to={user.role === "LIBRARIAN" ? "/librarian/dashboard" : "/member/dashboard"}
        replace
      />
    );
  }

  return <Outlet />;
}
