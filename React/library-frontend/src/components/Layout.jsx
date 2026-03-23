import { useMemo, useState } from "react";
import { useLocation, useNavigate, Outlet } from "react-router-dom";
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  Button,
  Chip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import BookIcon from "@mui/icons-material/MenuBook";
import AssignmentIcon from "@mui/icons-material/Assignment";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import NotificationsIcon from "@mui/icons-material/Notifications";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import LogoutIcon from "@mui/icons-material/Logout";
import { useAuth } from "../auth/AuthContext";

const drawerWidth = 250;

const menuByRole = {
  MEMBER: [
    { label: "Dashboard", path: "/member/dashboard", icon: <DashboardIcon /> },
    { label: "Books", path: "/member/books", icon: <BookIcon /> },
    { label: "Requests", path: "/member/requests", icon: <AssignmentIcon /> },
    { label: "Borrows", path: "/member/borrows", icon: <AutorenewIcon /> },
    { label: "Fines", path: "/member/fines", icon: <ReceiptLongIcon /> },
    { label: "Notifications", path: "/member/notifications", icon: <NotificationsIcon /> },
  ],
  LIBRARIAN: [
    { label: "Dashboard", path: "/librarian/dashboard", icon: <DashboardIcon /> },
    { label: "Books", path: "/librarian/books", icon: <LibraryBooksIcon /> },
    { label: "Book Copies", path: "/librarian/book-copies", icon: <Inventory2Icon /> },
    { label: "Requests", path: "/librarian/requests", icon: <AssignmentIcon /> },
    { label: "Borrows", path: "/librarian/borrows", icon: <AutorenewIcon /> },
    { label: "Fines", path: "/librarian/fines", icon: <ReceiptLongIcon /> },
  ],
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);

  const menus = useMemo(() => menuByRole[user?.role] || [], [user?.role]);

  const handleNavigate = (path) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const drawer = (
    <Box>
      <Box px={2.5} py={2.5}>
        <Typography variant="h6" fontWeight={700}>
          Library System
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {user?.role === "LIBRARIAN" ? "Librarian Panel" : "Member Portal"}
        </Typography>
      </Box>
      <List>
        {menus.map((item) => (
          <ListItemButton
            key={item.path}
            selected={location.pathname === item.path}
            onClick={() => handleNavigate(item.path)}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          boxShadow: "none",
          borderBottom: "1px solid #e4e8f0",
        }}
      >
        <Toolbar>
          {isMobile ? (
            <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(true)} sx={{ mr: 2 }}>
              <MenuIcon />
            </IconButton>
          ) : null}
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {location.pathname.split("/").slice(-1)[0].replace("-", " ").toUpperCase()}
          </Typography>
          <Chip
            label={`${user?.name || "User"} (${user?.id})`}
            color="secondary"
            sx={{ mr: 1.5, color: "#1d1d1d", fontWeight: 600 }}
          />
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<LogoutIcon />}
            onClick={() => {
              logout();
              navigate("/login");
            }}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: "64px" }}>
        <Outlet />
      </Box>
    </Box>
  );
}
