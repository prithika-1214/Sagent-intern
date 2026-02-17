import { Outlet } from 'react-router-dom';
import { Box, Container } from '@mui/material';
import Navbar from './Navbar';

const Layout = () => (
  <Box sx={{ minHeight: '100vh', background: 'var(--app-bg)' }}>
    <Navbar />
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Outlet />
    </Container>
  </Box>
);

export default Layout;