import { Box, Button, Typography } from "@mui/material";
import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <Box sx={{ textAlign: "center", mt: 8 }}>
      <Typography variant="h3" sx={{ fontWeight: 700 }}>
        404
      </Typography>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Page not found
      </Typography>
      <Button variant="contained" component={Link} to="/">
        Back to Home
      </Button>
    </Box>
  );
}

export default NotFoundPage;
