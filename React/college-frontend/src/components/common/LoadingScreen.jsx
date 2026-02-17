import { Box, CircularProgress, Typography } from "@mui/material";

const LoadingScreen = ({ label = "Loading..." }) => (
  <Box sx={{ minHeight: 240, display: "grid", placeItems: "center", gap: 1 }}>
    <CircularProgress />
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
  </Box>
);

export default LoadingScreen;
