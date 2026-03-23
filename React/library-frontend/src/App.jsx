import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import { useAuth } from "./auth/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";
import LoginPage from "./pages/public/LoginPage";
import RegisterPage from "./pages/public/RegisterPage";
import MemberDashboardPage from "./pages/member/MemberDashboardPage";
import MemberBooksPage from "./pages/member/MemberBooksPage";
import MemberRequestsPage from "./pages/member/MemberRequestsPage";
import MemberBorrowsPage from "./pages/member/MemberBorrowsPage";
import MemberFinesPage from "./pages/member/MemberFinesPage";
import MemberNotificationsPage from "./pages/member/MemberNotificationsPage";
import LibrarianDashboardPage from "./pages/librarian/LibrarianDashboardPage";
import LibrarianBooksPage from "./pages/librarian/LibrarianBooksPage";
import LibrarianBookCopiesPage from "./pages/librarian/LibrarianBookCopiesPage";
import LibrarianRequestsPage from "./pages/librarian/LibrarianRequestsPage";
import LibrarianBorrowsPage from "./pages/librarian/LibrarianBorrowsPage";
import LibrarianFinesPage from "./pages/librarian/LibrarianFinesPage";

function HomeRedirect() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Navigate
      to={user.role === "LIBRARIAN" ? "/librarian/dashboard" : "/member/dashboard"}
      replace
    />
  );
}

function PublicOnlyRoute({ children }) {
  const { user } = useAuth();

  if (user) {
    return (
      <Navigate
        to={user.role === "LIBRARIAN" ? "/librarian/dashboard" : "/member/dashboard"}
        replace
      />
    );
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <RegisterPage />
          </PublicOnlyRoute>
        }
      />

      <Route element={<ProtectedRoute allowedRoles={["MEMBER"]} />}>
        <Route element={<Layout />}>
          <Route path="/member/dashboard" element={<MemberDashboardPage />} />
          <Route path="/member/books" element={<MemberBooksPage />} />
          <Route path="/member/requests" element={<MemberRequestsPage />} />
          <Route path="/member/borrows" element={<MemberBorrowsPage />} />
          <Route path="/member/fines" element={<MemberFinesPage />} />
          <Route path="/member/notifications" element={<MemberNotificationsPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["LIBRARIAN"]} />}>
        <Route element={<Layout />}>
          <Route path="/librarian/dashboard" element={<LibrarianDashboardPage />} />
          <Route path="/librarian/books" element={<LibrarianBooksPage />} />
          <Route path="/librarian/book-copies" element={<LibrarianBookCopiesPage />} />
          <Route path="/librarian/requests" element={<LibrarianRequestsPage />} />
          <Route path="/librarian/borrows" element={<LibrarianBorrowsPage />} />
          <Route path="/librarian/fines" element={<LibrarianFinesPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
