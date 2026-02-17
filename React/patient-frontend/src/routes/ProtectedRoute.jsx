import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function getDefaultRoute(role) {
  if (role === "doctor") {
    return "/doctor/dashboard";
  }

  if (role === "patient") {
    return "/patient/registration";
  }

  return "/login";
}

export default function ProtectedRoute({ allowedRoles, children }) {
  const location = useLocation();
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={getDefaultRoute(role)} replace />;
  }

  return children;
}