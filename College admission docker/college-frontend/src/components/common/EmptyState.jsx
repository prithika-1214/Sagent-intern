import { Box, Paper, Typography } from "@mui/material";

const EmptyState = ({ title, subtitle }) => (
  <Paper variant="outlined" sx={{ p: 3, textAlign: "center" }}>
    <Typography variant="h6" sx={{ mb: 1 }}>
      {title}
    </Typography>
    <Typography variant="body2" color="text.secondary">
      {subtitle}
    </Typography>
  </Paper>
);

export default EmptyState;
