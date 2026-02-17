import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import AppLayout from "../components/layout/AppLayout";
import LoadingState from "../components/common/LoadingState";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import RegisterLibrarianPage from "../pages/auth/RegisterLibrarianPage";
import NotFoundPage from "../pages/NotFoundPage";
import LibrarianBookCopiesPage from "../pages/librarian/BookCopiesManagementPage";
import LibrarianBooksPage from "../pages/librarian/BooksManagementPage";
import LibrarianBorrowsPage from "../pages/librarian/LibrarianBorrowsPage";
import LibrarianDashboardPage from "../pages/librarian/LibrarianDashboardPage";
import LibrarianFinesPage from "../pages/librarian/LibrarianFinesPage";
import LibrarianReservationsPage from "../pages/librarian/LibrarianReservationsPage";
import MemberBooksPage from "../pages/member/MemberBooksPage";
import MemberBorrowsPage from "../pages/member/MemberBorrowsPage";
import MemberDashboardPage from "../pages/member/MemberDashboardPage";
import MemberFinesPage from "../pages/member/MemberFinesPage";
import MemberNotificationsPage from "../pages/member/MemberNotificationsPage";
import MemberReservationsPage from "../pages/member/MemberReservationsPage";
import ProtectedRoute from "./ProtectedRoute";

function RootRedirect() {
  const { isLoading, isAuthenticated, role } = useAuth();

  if (isLoading) {
    return <LoadingState label="Preparing application" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={role === "LIBRARIAN" ? "/librarian" : "/member"} replace />;
}

function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/register/librarian" element={<RegisterLibrarianPage />} />

      <Route element={<ProtectedRoute allowedRoles={["MEMBER"]} />}>
        <Route element={<AppLayout />}>
          <Route path="/member" element={<MemberDashboardPage />} />
          <Route path="/member/books" element={<MemberBooksPage />} />
          <Route path="/member/reservations" element={<MemberReservationsPage />} />
          <Route path="/member/borrows" element={<MemberBorrowsPage />} />
          <Route path="/member/fines" element={<MemberFinesPage />} />
          <Route path="/member/notifications" element={<MemberNotificationsPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["LIBRARIAN"]} />}>
        <Route element={<AppLayout />}>
          <Route path="/librarian" element={<LibrarianDashboardPage />} />
          <Route path="/librarian/books" element={<LibrarianBooksPage />} />
          <Route path="/librarian/book-copies" element={<LibrarianBookCopiesPage />} />
          <Route path="/librarian/reservations" element={<LibrarianReservationsPage />} />
          <Route path="/librarian/borrows" element={<LibrarianBorrowsPage />} />
          <Route path="/librarian/fines" element={<LibrarianFinesPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default AppRouter;
