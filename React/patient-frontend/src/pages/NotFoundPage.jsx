import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="min-vh-100 d-flex justify-content-center align-items-center p-3 auth-bg">
      <div className="card border-0 shadow-sm">
        <div className="card-body p-4 text-center">
          <h1 className="h4">Page Not Found</h1>
          <p className="text-secondary">The page you are looking for does not exist.</p>
          <Link to="/login" className="btn btn-primary">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}