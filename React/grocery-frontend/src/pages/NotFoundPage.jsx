import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="page-container">
      <div className="card mx-auto max-w-lg text-center">
        <h1 className="text-4xl font-bold text-slate-900">404</h1>
        <p className="mt-2 text-sm text-slate-600">The page you requested does not exist.</p>
        <Link
          to="/"
          className="mt-4 inline-block rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
