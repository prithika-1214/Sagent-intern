import { Navigate, Outlet } from "react-router-dom";
import { ROLES } from "../../constants/appConstants";
import { useAuth } from "../../context/AuthContext.jsx";

const RoleGuard = ({ allowedRoles = [], children }) => {
  const { role, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (!allowedRoles.includes(role)) {
    if (role === ROLES.OFFICER) {
      return <Navigate to="/officer" replace />;
    }
    return <Navigate to="/student" replace />;
  }

  return children ?? <Outlet />;
};

export default RoleGuard;
