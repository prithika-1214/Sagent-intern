import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from './ThemeToggle';

const menuItems = [
  { to: '/admin', label: 'Dashboard' },
  { to: '/admin/events', label: 'Manage Events' },
  { to: '/admin/venues', label: 'Manage Venues' },
  { to: '/admin/seats', label: 'Manage Seats' },
  { to: '/admin/schedules', label: 'Manage Schedules' },
  { to: '/admin/event-seats', label: 'Manage Event Seats' },
  { to: '/admin/bookings', label: 'Manage Bookings' },
  { to: '/admin/users', label: 'Manage Users' },
  { to: '/admin/payments', label: 'Manage Payments' },
  { to: '/admin/cancellations', label: 'Manage Cancellations' }
];

const Sidebar = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <aside className="sidebar">
      <h2>Admin Panel</h2>
      <p className="sidebar-meta">Tickify Admin</p>
      <nav>
        {menuItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/admin'}
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <ThemeToggle sidebar />
      <button type="button" className="btn btn-outline btn-small sidebar-logout" onClick={handleLogout}>
        Logout
      </button>
    </aside>
  );
};

export default Sidebar;
