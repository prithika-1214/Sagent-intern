import { Box, Paper, Typography } from "@mui/material";

function EmptyState({ title = "No data found", description = "Try adjusting filters or adding new data." }) {
  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ textAlign: "center" }}>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </Box>
    </Paper>
  );
}

export default EmptyState;
