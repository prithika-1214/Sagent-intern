import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';

const AdminLayout = () => (
  <div className="admin-layout">
    <Sidebar />
    <main className="admin-content">
      <Outlet />
    </main>
  </div>
);

export default AdminLayout;
