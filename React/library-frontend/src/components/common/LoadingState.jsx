import { Box, CircularProgress, Typography } from "@mui/material";

function LoadingState({ label = "Loading...", minHeight = 240 }) {
  return (
    <Box
      sx={{
        minHeight,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1,
      }}
    >
      <CircularProgress />
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </Box>
  );
}

export default LoadingState;
