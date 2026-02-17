import {
  AppBar,
  Box,
  Chip,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Button,
} from "@mui/material";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import AutoStoriesOutlinedIcon from "@mui/icons-material/AutoStoriesOutlined";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

const drawerWidth = 250;

const memberNav = [
  { label: "Dashboard", path: "/member", icon: <DashboardOutlinedIcon /> },
  { label: "Books", path: "/member/books", icon: <MenuBookOutlinedIcon /> },
  { label: "Reservations", path: "/member/reservations", icon: <AssignmentTurnedInOutlinedIcon /> },
  { label: "Borrows", path: "/member/borrows", icon: <AssignmentOutlinedIcon /> },
  { label: "Fines", path: "/member/fines", icon: <ReceiptLongOutlinedIcon /> },
  { label: "Notifications", path: "/member/notifications", icon: <NotificationsOutlinedIcon /> },
];

const librarianNav = [
  { label: "Dashboard", path: "/librarian", icon: <DashboardOutlinedIcon /> },
  { label: "Books", path: "/librarian/books", icon: <MenuBookOutlinedIcon /> },
  { label: "Book Copies", path: "/librarian/book-copies", icon: <AutoStoriesOutlinedIcon /> },
  { label: "Reservations", path: "/librarian/reservations", icon: <AssignmentTurnedInOutlinedIcon /> },
  { label: "Borrows", path: "/librarian/borrows", icon: <AssignmentOutlinedIcon /> },
  { label: "Fines", path: "/librarian/fines", icon: <ReceiptLongOutlinedIcon /> },
  { label: "Inventory", path: "/librarian/books", icon: <Inventory2OutlinedIcon /> },
];

function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { role, currentUserName, logout } = useAuth();
  const navItems = role === "LIBRARIAN" ? librarianNav : memberNav;

  const toggleDrawer = () => {
    setMobileOpen((previous) => !previous);
  };

  const drawerContent = (
    <Box>
      <Toolbar>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Library LMS
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItem disablePadding key={item.path}>
            <ListItemButton
              component={NavLink}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              sx={{
                "&.active": {
                  bgcolor: "primary.light",
                  color: "primary.contrastText",
                  "& .MuiListItemIcon-root": { color: "primary.contrastText" },
                },
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: "#263238",
        }}
      >
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={toggleDrawer} sx={{ mr: 2, display: { sm: "none" } }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Welcome, {currentUserName}
          </Typography>
          <Chip label={role || "GUEST"} color="secondary" size="small" sx={{ mr: 2 }} />
          <Button color="inherit" startIcon={<LogoutIcon />} onClick={logout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={toggleDrawer}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
          }}
        >
          {drawerContent}
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
          }}
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          backgroundColor: "#f4f6f8",
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}

export default AppLayout;
