import { Link, NavLink, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { ROLES } from "../../utils/constants";

const navLinkClass = ({ isActive }) =>
  `rounded-md px-3 py-2 text-sm font-medium transition ${
    isActive ? "bg-brand-100 text-brand-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
  }`;

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const role = user?.role || ROLES.CUSTOMER;

  const handleLogout = () => {
    logout();
    navigate("/auth/login");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="page-container flex items-center justify-between py-3">
        <Link to="/" className="text-xl font-bold text-brand-700">
          GroceryGo
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <NavLink to="/products" className={navLinkClass}>
            Products
          </NavLink>

          {isAuthenticated && (
            <>
              <NavLink to="/cart" className={navLinkClass}>
                Cart
              </NavLink>
              <NavLink to="/orders" className={navLinkClass}>
                Orders
              </NavLink>
              <NavLink to="/notifications" className={navLinkClass}>
                Notifications
              </NavLink>
            </>
          )}

          {role === ROLES.STORE && (
            <NavLink to="/store" className={navLinkClass}>
              Store Dashboard
            </NavLink>
          )}

          {role === ROLES.DELIVERY_AGENT && (
            <NavLink to="/delivery" className={navLinkClass}>
              Delivery Dashboard
            </NavLink>
          )}

          {role === ROLES.STORE && (
            <>
              <NavLink to="/admin/products" className={navLinkClass}>
                Admin Products
              </NavLink>
              <NavLink to="/admin/categories" className={navLinkClass}>
                Admin Categories
              </NavLink>
            </>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <div className="hidden rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 sm:block">
                {user?.name || "User"} ({role})
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/auth/login"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Login
              </Link>
              <Link
                to="/auth/register"
                className="rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>

      <nav className="page-container -mt-2 mb-2 flex gap-1 overflow-x-auto pb-2 md:hidden">
        <NavLink to="/products" className={navLinkClass}>
          Products
        </NavLink>

        {isAuthenticated && (
          <>
            <NavLink to="/cart" className={navLinkClass}>
              Cart
            </NavLink>
            <NavLink to="/orders" className={navLinkClass}>
              Orders
            </NavLink>
            <NavLink to="/notifications" className={navLinkClass}>
              Notifications
            </NavLink>
          </>
        )}

        {role === ROLES.STORE && (
          <>
            <NavLink to="/store" className={navLinkClass}>
              Store
            </NavLink>
            <NavLink to="/admin/products" className={navLinkClass}>
              Admin Products
            </NavLink>
            <NavLink to="/admin/categories" className={navLinkClass}>
              Admin Categories
            </NavLink>
          </>
        )}

        {role === ROLES.DELIVERY_AGENT && (
          <NavLink to="/delivery" className={navLinkClass}>
            Delivery
          </NavLink>
        )}
      </nav>
    </header>
  );
}
