import { Box, Button, Container, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

const NotFoundPage = () => (
  <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
    <Container maxWidth="sm">
      <Stack spacing={2} textAlign="center">
        <Typography variant="h2">404</Typography>
        <Typography variant="h5">Page not found</Typography>
        <Typography color="text.secondary">
          The page you requested does not exist or may have been moved.
        </Typography>
        <Button component={RouterLink} to="/">
          Go to Home
        </Button>
      </Stack>
    </Container>
  </Box>
);

export default NotFoundPage;
