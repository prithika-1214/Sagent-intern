import React from "react";
import { Alert, Box, Typography } from "@mui/material";

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || "Something went wrong." };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("Unhandled UI error", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", p: 3 }}>
          <Alert severity="error" sx={{ maxWidth: 560 }}>
            <Typography variant="h6">Application Error</Typography>
            <Typography variant="body2">{this.state.message}</Typography>
          </Alert>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;
