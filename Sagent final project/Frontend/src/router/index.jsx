import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import PublicLayout from '../pages/public/PublicLayout';
import LandingPage from '../pages/public/LandingPage';
import EventsPage from '../pages/public/EventsPage';
import EventDetailsPage from '../pages/public/EventDetailsPage';
import SeatSelectionPage from '../pages/public/SeatSelectionPage';
import ConcertTicketSelectionPage from '../pages/public/ConcertTicketSelectionPage';
import CheckoutPage from '../pages/public/CheckoutPage';
import BookingSuccessPage from '../pages/public/BookingSuccessPage';
import MyBookingsPage from '../pages/public/MyBookingsPage';
import NotFoundPage from '../pages/public/NotFoundPage';
import AdminLayout from '../pages/admin/AdminLayout';
import DashboardHomePage from '../pages/admin/DashboardHomePage';
import ManageEventsPage from '../pages/admin/ManageEventsPage';
import ManageVenuesPage from '../pages/admin/ManageVenuesPage';
import ManageSeatsPage from '../pages/admin/ManageSeatsPage';
import ManageSchedulesPage from '../pages/admin/ManageSchedulesPage';
import ManageEventSeatsPage from '../pages/admin/ManageEventSeatsPage';
import ManageBookingsPage from '../pages/admin/ManageBookingsPage';
import ManageUsersPage from '../pages/admin/ManageUsersPage';
import ManagePaymentsPage from '../pages/admin/ManagePaymentsPage';
import ManageCancellationsPage from '../pages/admin/ManageCancellationsPage';
import LoginPage from '../pages/auth/LoginPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import RegisterPage from '../pages/auth/RegisterPage';
import { useAuth } from '../context/AuthContext';
import { getDefaultRouteForRole, isRoleAllowed } from '../utils/auth';

const RequireAuth = ({ children, allowedRoles = [] }) => {
  const location = useLocation();
  const { isAuthenticated, currentUser } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!isRoleAllowed(currentUser?.role, allowedRoles)) {
    return <Navigate to={getDefaultRouteForRole(currentUser?.role)} replace />;
  }

  return children;
};

const RoleAwareHomeRoute = () => {
  const { currentUser } = useAuth();
  const targetRoute = getDefaultRouteForRole(currentUser?.role);

  if (targetRoute !== '/') {
    return <Navigate to={targetRoute} replace />;
  }

  return <LandingPage />;
};

const GuestOnlyRoute = ({ children }) => {
  const { isAuthenticated, currentUser } = useAuth();
  if (isAuthenticated) {
    return <Navigate to={getDefaultRouteForRole(currentUser?.role)} replace />;
  }
  return children;
};

const AppRouter = () => (
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <Routes>
      <Route element={<PublicLayout />}>
        <Route
          path="/"
          element={
            <RequireAuth>
              <RoleAwareHomeRoute />
            </RequireAuth>
          }
        />
        <Route
          path="/events"
          element={
            <RequireAuth>
              <EventsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/events/:eventId"
          element={
            <RequireAuth>
              <EventDetailsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/login"
          element={
            <GuestOnlyRoute>
              <LoginPage />
            </GuestOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <GuestOnlyRoute>
              <RegisterPage />
            </GuestOnlyRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <GuestOnlyRoute>
              <ForgotPasswordPage />
            </GuestOnlyRoute>
          }
        />
        <Route
          path="/schedules/:scheduleId/seats"
          element={
            <RequireAuth>
              <SeatSelectionPage />
            </RequireAuth>
          }
        />
        <Route
          path="/schedules/:scheduleId/concert-tickets"
          element={
            <RequireAuth>
              <ConcertTicketSelectionPage />
            </RequireAuth>
          }
        />
        <Route
          path="/checkout"
          element={
            <RequireAuth>
              <CheckoutPage />
            </RequireAuth>
          }
        />
        <Route
          path="/booking/success"
          element={
            <RequireAuth>
              <BookingSuccessPage />
            </RequireAuth>
          }
        />
        <Route
          path="/my-bookings"
          element={
            <RequireAuth>
              <MyBookingsPage />
            </RequireAuth>
          }
        />
      </Route>

      <Route
        path="/admin"
        element={
          <RequireAuth allowedRoles={['ADMIN']}>
            <AdminLayout />
          </RequireAuth>
        }
      >
        <Route index element={<DashboardHomePage />} />
        <Route path="events" element={<ManageEventsPage />} />
        <Route path="venues" element={<ManageVenuesPage />} />
        <Route path="seats" element={<ManageSeatsPage />} />
        <Route path="schedules" element={<ManageSchedulesPage />} />
        <Route path="event-seats" element={<ManageEventSeatsPage />} />
        <Route path="bookings" element={<ManageBookingsPage />} />
        <Route path="users" element={<ManageUsersPage />} />
        <Route path="payments" element={<ManagePaymentsPage />} />
        <Route path="cancellations" element={<ManageCancellationsPage />} />
      </Route>

      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  </BrowserRouter>
);

export default AppRouter;
