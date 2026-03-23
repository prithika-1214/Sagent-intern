import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useActiveUser } from '../context/ActiveUserContext';

const Protected = () => {
  const { activeUser } = useActiveUser();
  const location = useLocation();

  if (!activeUser?.id) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
};

export default Protected;
