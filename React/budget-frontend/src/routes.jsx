import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Protected from './components/Protected';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Income from './pages/Income';
import Expenses from './pages/Expenses';
import Categories from './pages/Categories';
import Savings from './pages/Savings';

const AppRoutes = () => (
  <Routes>
    <Route element={<Layout />}>
      <Route path="/auth" element={<Auth />} />
      <Route path="/register" element={<Navigate to="/auth" replace />} />

      <Route element={<Protected />}>
        <Route index element={<Dashboard />} />
        <Route path="/users" element={<Users />} />
        <Route path="/income" element={<Income />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/savings" element={<Savings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  </Routes>
);

export default AppRoutes;
