import React from "react";
import ReactDOM from "react-dom/client";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App.jsx";
import { AuthProvider } from "./auth/AuthContext";
import "./styles/global.css";

const theme = createTheme({
  palette: {
    primary: {
      main: "#1565c0",
    },
    secondary: {
      main: "#00897b",
    },
    background: {
      default: "#f4f6f8",
    },
  },
  shape: {
    borderRadius: 10,
  },
  typography: {
    fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
    </ThemeProvider>
  </React.StrictMode>
);
