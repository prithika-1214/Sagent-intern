import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const linksByRole = {
  patient: [
    { to: "/patient/registration", label: "My Profile" },
    { to: "/patient/health-data", label: "Health Data Entry" },
    { to: "/patient/appointments", label: "My Appointments" },
    { to: "/patient/feedback", label: "My Feedback" }
  ],
  doctor: [
    { to: "/doctor/dashboard", label: "Dashboard" },
    { to: "/doctor/consultation", label: "Consultation" }
  ]
};

export default function AppLayout() {
  const navigate = useNavigate();
  const { role, user, logout } = useAuth();

  const links = linksByRole[role] || [];

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-vh-100 app-bg">
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
        <div className="container">
          <span className="navbar-brand fw-semibold">Patient Monitoring System</span>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#mainNav"
            aria-controls="mainNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon" />
          </button>

          <div className="collapse navbar-collapse" id="mainNav">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              {links.map((item) => (
                <li className="nav-item" key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) => `nav-link${isActive ? " active fw-semibold" : ""}`}
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>

            <div className="d-flex align-items-center gap-3 text-white">
              <span className="small">
                Logged in as: <strong>{user?.name || `${role || "user"}`}</strong>
              </span>
              <button type="button" className="btn btn-sm btn-light" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="container py-4">
        <Outlet />
      </main>
    </div>
  );
}
