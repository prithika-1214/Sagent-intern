import { useEffect, useState } from 'react';
import StatCard from '../../components/common/StatCard';
import Loader from '../../components/common/Loader';
import ErrorState from '../../components/common/ErrorState';
import { getUsers } from '../../api/usersApi';
import { getEvents } from '../../api/eventsApi';
import { getVenues } from '../../api/venuesApi';
import { getSchedules } from '../../api/schedulesApi';
import { getBookings } from '../../api/bookingsApi';
import { getPayments } from '../../api/paymentsApi';
import { getCancellations } from '../../api/cancellationsApi';
import { normalizeArray } from '../../utils/entity';

const statCards = [
  { key: 'users', title: 'Total Users', color: 'blue', to: '/admin/users' },
  { key: 'events', title: 'Total Events', color: 'orange', to: '/admin/events' },
  { key: 'venues', title: 'Total Venues', color: 'teal', to: '/admin/venues' },
  { key: 'schedules', title: 'Total Schedules', color: 'purple', to: '/admin/schedules' },
  { key: 'bookings', title: 'Total Bookings', color: 'green', to: '/admin/bookings' },
  { key: 'payments', title: 'Total Payments', color: 'pink', to: '/admin/payments' },
  { key: 'cancellations', title: 'Total Cancellations', color: 'red', to: '/admin/cancellations' }
];

const DashboardHomePage = () => {
  const [stats, setStats] = useState({
    users: 0,
    events: 0,
    venues: 0,
    schedules: 0,
    bookings: 0,
    payments: 0,
    cancellations: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError('');
      const [users, events, venues, schedules, bookings, payments, cancellations] = await Promise.all([
        getUsers(),
        getEvents(),
        getVenues(),
        getSchedules(),
        getBookings(),
        getPayments(),
        getCancellations()
      ]);

      setStats({
        users: normalizeArray(users).length,
        events: normalizeArray(events).length,
        venues: normalizeArray(venues).length,
        schedules: normalizeArray(schedules).length,
        bookings: normalizeArray(bookings).length,
        payments: normalizeArray(payments).length,
        cancellations: normalizeArray(cancellations).length
      });
    } catch (err) {
      setError(err.message || 'Unable to load admin dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return <Loader text="Loading dashboard..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadDashboard} />;
  }

  return (
    <section className="admin-page">
      <div className="section-head">
        <div>
          <h1>Dashboard Overview</h1>
        </div>
      </div>

      <div className="stats-grid">
        {statCards.map((card) => (
          <StatCard key={card.key} title={card.title} value={stats[card.key]} color={card.color} to={card.to} />
        ))}
      </div>
    </section>
  );
};

export default DashboardHomePage;
