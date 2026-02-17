import DashboardIcon from "@mui/icons-material/Dashboard";
import DescriptionIcon from "@mui/icons-material/Description";
import AddBoxIcon from "@mui/icons-material/AddBox";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import HomeIcon from "@mui/icons-material/Home";
import {
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
} from "@mui/material";
import { useMemo } from "react";
import { NavLink } from "react-router-dom";
import { ROLES } from "../../constants/appConstants";
import { useAuth } from "../../context/AuthContext.jsx";

const drawerWidth = 260;

const Sidebar = ({ mobileOpen, onClose }) => {
  const { role } = useAuth();

  const navItems = useMemo(() => {
    if (role === ROLES.OFFICER) {
      return [
        { label: "Officer Dashboard", to: "/officer", icon: <AdminPanelSettingsIcon /> },
      ];
    }

    return [
      { label: "Dashboard", to: "/student", icon: <DashboardIcon /> },
      { label: "New Application", to: "/student/applications/new", icon: <AddBoxIcon /> },
      { label: "My Applications", to: "/student/applications", icon: <DescriptionIcon /> },
    ];
  }, [role]);

  const drawerContent = (
    <>
      <Toolbar />
      <Divider />
      <List>
        <ListItemButton component={NavLink} to="/" onClick={onClose}>
          <ListItemIcon>
            <HomeIcon />
          </ListItemIcon>
          <ListItemText primary="Home" />
        </ListItemButton>
        {navItems.map((item) => (
          <ListItemButton key={item.to} component={NavLink} to={item.to} onClick={onClose}>
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </>
  );

  return (
    <>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
        }}
      >
        {drawerContent}
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: drawerWidth,
            borderRight: 1,
            borderColor: "divider",
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </>
  );
};

export { drawerWidth };
export default Sidebar;
