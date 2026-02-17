import { Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import ProtectedRoute from "./components/route/ProtectedRoute";
import RoleGuard from "./components/route/RoleGuard";
import { ROLES } from "./constants/appConstants";
import OfficerDashboardPage from "./pages/officer/OfficerDashboardPage";
import OfficerLoginPage from "./pages/officer/OfficerLoginPage";
import OfficerRegisterPage from "./pages/officer/OfficerRegisterPage";
import LandingPage from "./pages/public/LandingPage";
import NotFoundPage from "./pages/public/NotFoundPage";
import ApplicationDetailsPage from "./pages/student/ApplicationDetailsPage";
import MyApplicationsPage from "./pages/student/MyApplicationsPage";
import NewApplicationPage from "./pages/student/NewApplicationPage";
import StudentDashboardPage from "./pages/student/StudentDashboardPage";
import StudentLoginPage from "./pages/student/StudentLoginPage";
import StudentRegisterPage from "./pages/student/StudentRegisterPage";

const App = () => (
  <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/student/login" element={<StudentLoginPage />} />
    <Route path="/student/register" element={<StudentRegisterPage />} />
    <Route path="/officer/login" element={<OfficerLoginPage />} />
    <Route path="/officer/register" element={<OfficerRegisterPage />} />

    <Route element={<ProtectedRoute />}>
      <Route
        element={
          <RoleGuard allowedRoles={[ROLES.STUDENT]}>
            <MainLayout />
          </RoleGuard>
        }
      >
        <Route path="/student" element={<StudentDashboardPage />} />
        <Route path="/student/applications/new" element={<NewApplicationPage />} />
        <Route path="/student/applications" element={<MyApplicationsPage />} />
        <Route path="/student/applications/:id" element={<ApplicationDetailsPage />} />
      </Route>

      <Route
        element={
          <RoleGuard allowedRoles={[ROLES.OFFICER]}>
            <MainLayout />
          </RoleGuard>
        }
      >
        <Route path="/officer" element={<OfficerDashboardPage />} />
      </Route>
    </Route>

    <Route path="/404" element={<NotFoundPage />} />
    <Route path="*" element={<Navigate to="/404" replace />} />
  </Routes>
);

export default App;
