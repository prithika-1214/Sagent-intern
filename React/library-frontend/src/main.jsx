import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { Toaster } from "react-hot-toast";
import App from "./App";
import { AuthProvider } from "./auth/AuthContext";

const theme = createTheme({
  palette: {
    primary: {
      main: "#0f5c72",
    },
    secondary: {
      main: "#f0a202",
    },
    background: {
      default: "#f4f7fb",
    },
  },
  shape: {
    borderRadius: 10,
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
      <Toaster position="top-right" />
    </ThemeProvider>
  </React.StrictMode>
);
