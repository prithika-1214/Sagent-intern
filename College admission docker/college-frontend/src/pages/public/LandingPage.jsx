import LoginIcon from "@mui/icons-material/Login";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import SecurityIcon from "@mui/icons-material/Security";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

const LandingPage = () => (
  <Box sx={{ minHeight: "100vh", py: { xs: 8, md: 12 } }}>
    <Container maxWidth="lg">
      <Stack spacing={3} sx={{ mb: 6, maxWidth: 760 }}>
        <Typography variant="h3">College Admissions Management System</Typography>
        <Typography variant="h6" color="text.secondary">
          Complete online admission lifecycle for students and admission officers with transparent tracking.
        </Typography>
      </Stack>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Stack spacing={2}>
                <PersonAddAlt1Icon color="primary" fontSize="large" />
                <Typography variant="h5">Student Register</Typography>
                <Typography color="text.secondary">
                  Create your student account and start a new application.
                </Typography>
                <Button component={RouterLink} to="/student/register" startIcon={<PersonAddAlt1Icon />}>
                  Register
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Stack spacing={2}>
                <LoginIcon color="primary" fontSize="large" />
                <Typography variant="h5">Student Login</Typography>
                <Typography color="text.secondary">
                  Continue your admission process, payments, and application tracking.
                </Typography>
                <Button component={RouterLink} to="/student/login" startIcon={<LoginIcon />}>
                  Student Login
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Stack spacing={2}>
                <SecurityIcon color="primary" fontSize="large" />
                <Typography variant="h5">Officer Login</Typography>
                <Typography color="text.secondary">
                  Review submitted applications and update admission decisions.
                </Typography>
                <Button component={RouterLink} to="/officer/login" startIcon={<SecurityIcon />}>
                  Officer Login
                </Button>
                <Button component={RouterLink} to="/officer/register" variant="outlined">
                  Officer Register
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  </Box>
);

export default LandingPage;
