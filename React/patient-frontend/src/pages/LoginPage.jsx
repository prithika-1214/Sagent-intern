import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getDoctorById } from "../api/doctors";
import { getPatientById } from "../api/patients";
import ErrorAlert from "../components/ErrorAlert";
import { useToast } from "../components/ToastProvider";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../utils/formatters";

function getDefaultRoute(role) {
  return role === "doctor" ? "/doctor/dashboard" : "/patient/registration";
}

function getProfileName(profile, role) {
  return (
    profile?.name ||
    profile?.fullName ||
    profile?.doctorName ||
    profile?.patientName ||
    `${role} ${getProfileId(profile) || ""}`.trim()
  );
}

function getProfileId(profile) {
  return profile?.id ?? profile?.doctorId ?? profile?.patientId ?? "";
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const { isAuthenticated, role: activeRole, login } = useAuth();

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

  const [role, setRole] = useState("patient");
  const [profileId, setProfileId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const redirectPath = useMemo(() => {
    const fromPath = location?.state?.from?.pathname;
    return fromPath && fromPath !== "/login" ? fromPath : getDefaultRoute(role);
  }, [location?.state?.from?.pathname, role]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(getDefaultRoute(activeRole), { replace: true });
    }
  }, [activeRole, isAuthenticated, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const normalizedId = profileId.trim();
    if (!normalizedId) {
      setError("Profile ID is required.");
      return;
    }

    setSubmitting(true);

    try {
      const selectedProfile =
        role === "doctor" ? await getDoctorById(normalizedId) : await getPatientById(normalizedId);

      const normalizedProfile = {
        ...selectedProfile,
        id: getProfileId(selectedProfile) || normalizedId,
        name: getProfileName(selectedProfile, role)
      };

      login(role, normalizedProfile);
      showToast({
        title: "Login Successful",
        message: `Logged in as ${normalizedProfile.name}.`,
        variant: "success"
      });

      navigate(redirectPath, { replace: true });
    } catch (apiError) {
      const fallback =
        apiError?.message === "Network Error"
          ? `Cannot reach backend at ${apiBaseUrl}. Start backend and verify CORS.`
          : "Unable to login. Verify role and profile ID.";

      const message =
        apiError?.response?.status === 404
          ? `${role === "doctor" ? "Doctor" : "Patient"} not found. Check ID or register first.`
          : getErrorMessage(apiError, fallback);

      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center auth-bg p-3">
      <div className="card auth-card shadow-lg border-0">
        <div className="card-body p-4 p-md-5">
          <h1 className="h3 mb-2">Patient Monitoring System</h1>
          <p className="text-secondary mb-4">Login using your role and profile ID.</p>

          <ErrorAlert message={error} onDismiss={() => setError("")} />

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label htmlFor="role" className="form-label fw-semibold">
                Role
              </label>
              <select
                id="role"
                className="form-select"
                value={role}
                onChange={(event) => setRole(event.target.value)}
              >
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
              </select>
            </div>

            <div className="mb-3">
              <label htmlFor="profileId" className="form-label fw-semibold">
                Profile ID
              </label>
              <input
                id="profileId"
                type="text"
                className="form-control"
                value={profileId}
                onChange={(event) => setProfileId(event.target.value)}
                placeholder={`Enter ${role} ID`}
              />
            </div>

            <button type="submit" className="btn btn-primary w-100" disabled={submitting}>
              {submitting ? "Signing in..." : "Continue"}
            </button>

            <div className="d-flex gap-2 mt-3">
              <Link to="/register/patient" className="btn btn-outline-secondary w-100">
                Register Patient
              </Link>
              <Link to="/register/doctor" className="btn btn-outline-secondary w-100">
                Register Doctor
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
