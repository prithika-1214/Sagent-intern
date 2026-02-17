import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import ProtectedRoute from "./ProtectedRoute";
import LoginPage from "../pages/LoginPage";
import PatientRegistrationPage from "../pages/PatientRegistrationPage";
import DoctorRegistrationPage from "../pages/DoctorRegistrationPage";
import HealthDataPage from "../pages/HealthDataPage";
import PatientAppointmentsPage from "../pages/PatientAppointmentsPage";
import PatientFeedbackPage from "../pages/PatientFeedbackPage";
import DoctorDashboardPage from "../pages/DoctorDashboardPage";
import DoctorConsultationPage from "../pages/DoctorConsultationPage";
import NotFoundPage from "../pages/NotFoundPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register/patient" element={<PatientRegistrationPage />} />
      <Route path="/register/doctor" element={<DoctorRegistrationPage />} />

      <Route
        element={
          <ProtectedRoute allowedRoles={["patient"]}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/patient/registration" element={<PatientRegistrationPage />} />
        <Route path="/patient/health-data" element={<HealthDataPage />} />
        <Route path="/patient/appointments" element={<PatientAppointmentsPage />} />
        <Route path="/patient/feedback" element={<PatientFeedbackPage />} />
      </Route>

      <Route
        element={
          <ProtectedRoute allowedRoles={["doctor"]}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/doctor/dashboard" element={<DoctorDashboardPage />} />
        <Route path="/doctor/consultation" element={<DoctorConsultationPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
