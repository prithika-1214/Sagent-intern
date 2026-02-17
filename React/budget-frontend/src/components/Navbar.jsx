import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Toolbar,
  Typography
} from '@mui/material';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import PersonRemoveRoundedIcon from '@mui/icons-material/PersonRemoveRounded';
import { toast } from 'react-toastify';
import { useActiveUser } from '../context/ActiveUserContext';

const navLinks = [
  { label: 'Auth', to: '/auth' },
  { label: 'Dashboard', to: '/' },
  { label: 'Users', to: '/users' },
  { label: 'Income', to: '/income' },
  { label: 'Expenses', to: '/expenses' },
  { label: 'Categories', to: '/categories' },
  { label: 'Savings', to: '/savings' }
];

const linkButtonSx = {
  px: 1.25,
  borderRadius: 2,
  textTransform: 'none',
  color: 'rgba(255,255,255,0.86)',
  '&.active': {
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.2)'
  }
};

const Navbar = () => {
  const navigate = useNavigate();
  const { activeUser, clearActiveUser } = useActiveUser();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleClearActiveUser = () => {
    clearActiveUser();
    toast.info('Active user cleared. Please choose a user.');
    navigate('/auth');
    setMobileOpen(false);
  };

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          background: 'linear-gradient(120deg, #0f3460, #1f5aa6)',
          borderBottom: '1px solid rgba(255,255,255,0.15)'
        }}
      >
        <Toolbar sx={{ gap: 1 }}>
          <IconButton color="inherit" edge="start" sx={{ display: { md: 'none' } }} onClick={() => setMobileOpen(true)}>
            <MenuRoundedIcon />
          </IconButton>

          <Typography
            variant="h6"
            component={NavLink}
            to="/"
            sx={{
              color: '#fff',
              textDecoration: 'none',
              fontWeight: 800,
              letterSpacing: 0.3,
              minWidth: { xs: 'auto', md: 165 }
            }}
          >
            Budget Tracker
          </Typography>

          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.5, flexWrap: 'wrap' }}>
            {navLinks.map((link) => (
              <Button key={link.to} component={NavLink} to={link.to} sx={linkButtonSx}>
                {link.label}
              </Button>
            ))}
          </Box>

          <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              size="small"
              color={activeUser ? 'success' : 'default'}
              label={activeUser ? `Active: ${activeUser.name || activeUser.email || activeUser.id}` : 'No active user'}
              sx={{
                maxWidth: 220,
                '& .MuiChip-label': {
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }
              }}
            />
            {activeUser && (
              <Button
                color="inherit"
                variant="outlined"
                size="small"
                onClick={handleClearActiveUser}
                startIcon={<PersonRemoveRoundedIcon />}
                sx={{
                  borderColor: 'rgba(255,255,255,0.35)',
                  color: '#fff',
                  '&:hover': {
                    borderColor: 'rgba(255,255,255,0.65)'
                  },
                  display: { xs: 'none', sm: 'inline-flex' }
                }}
              >
                Clear
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer anchor="left" open={mobileOpen} onClose={() => setMobileOpen(false)}>
        <Box sx={{ width: 280 }} role="presentation">
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" fontWeight={800}>
              Budget Tracker
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {activeUser ? `Active user: ${activeUser.name || activeUser.email}` : 'No active user selected'}
            </Typography>
          </Box>
          <Divider />
          <List>
            {navLinks.map((link) => (
              <ListItem key={link.to} disablePadding>
                <ListItemButton component={NavLink} to={link.to} onClick={() => setMobileOpen(false)}>
                  <ListItemText primary={link.label} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          {activeUser && (
            <Box sx={{ p: 2 }}>
              <Button fullWidth variant="outlined" color="error" onClick={handleClearActiveUser}>
                Clear Active User
              </Button>
            </Box>
          )}
        </Box>
      </Drawer>
    </>
  );
};

export default Navbar;
