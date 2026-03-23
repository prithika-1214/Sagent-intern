import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { canAccessAdmin, normalizeRole } from '../../utils/auth';
import ThemeToggle from './ThemeToggle';

const Navbar = () => {
  const navigate = useNavigate();
  const { isAuthenticated, currentUser, logout } = useAuth();
  const isAdminUser = canAccessAdmin(currentUser?.role);
  const navUserLabel = isAdminUser
    ? 'Tickify Admin'
    : `${currentUser?.name} (${normalizeRole(currentUser?.role)})`;

  const navItems = [
    { to: '/', label: 'Home' },
    { to: '/events', label: 'Events' }
  ];

  const visibleNavItems = isAuthenticated ? [...navItems] : [];

  if (isAuthenticated) {
    visibleNavItems.push({ to: '/my-bookings', label: 'My Bookings' });
  }

  if (isAdminUser) {
    visibleNavItems.push({ to: '/admin', label: 'Admin' });
  }

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <NavLink to="/" className="brand">
          Tickify
        </NavLink>
        <nav className="nav-links">
          {visibleNavItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'active' : '')}>
              {item.label}
            </NavLink>
          ))}
          <ThemeToggle />
          {isAuthenticated ? (
            <>
              <span className="nav-user">{navUserLabel}</span>
              <button type="button" className="btn btn-outline btn-small nav-btn" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={({ isActive }) => (isActive ? 'active' : '')}>
                Login
              </NavLink>
              <NavLink to="/register" className={({ isActive }) => (isActive ? 'active' : '')}>
                Register
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
