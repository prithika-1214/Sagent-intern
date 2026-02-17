import AddIcon from "@mui/icons-material/Add";
import DescriptionIcon from "@mui/icons-material/Description";
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import EmptyState from "../../components/common/EmptyState";
import LoadingScreen from "../../components/common/LoadingScreen";
import StatusChip from "../../components/common/StatusChip";
import { APPLICATION_STATUS } from "../../constants/appConstants";
import { useAuth } from "../../context/AuthContext.jsx";
import { useStudentApplicationsQuery } from "../../hooks/useApplications";
import { formatDateTime } from "../../utils/date";

const StudentDashboardPage = () => {
  const { user } = useAuth();
  const { data = [], isLoading } = useStudentApplicationsQuery(user?.userId);

  if (isLoading) {
    return <LoadingScreen label="Loading dashboard" />;
  }

  const counts = {
    total: data.length,
    pending: data.filter((item) =>
      [APPLICATION_STATUS.SUBMITTED, APPLICATION_STATUS.UNDER_REVIEW].includes(item.status),
    ).length,
    accepted: data.filter((item) => item.status === APPLICATION_STATUS.ACCEPTED).length,
    rejected: data.filter((item) => item.status === APPLICATION_STATUS.REJECTED).length,
  };

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
      >
        <Box>
          <Typography variant="h4">Welcome, {user?.name}</Typography>
          <Typography color="text.secondary">Track your admission journey in real-time.</Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button component={RouterLink} to="/student/applications/new" startIcon={<AddIcon />}>
            New Application
          </Button>
          <Button component={RouterLink} to="/student/applications" variant="outlined" startIcon={<DescriptionIcon />}>
            My Applications
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">Total Applications</Typography>
              <Typography variant="h4">{counts.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">Pending</Typography>
              <Typography variant="h4">{counts.pending}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">Accepted</Typography>
              <Typography variant="h4">{counts.accepted}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">Rejected</Typography>
              <Typography variant="h4">{counts.rejected}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Recent Applications
          </Typography>

          {data.length === 0 ? (
            <EmptyState
              title="No applications yet"
              subtitle="Create a new application to begin your admission process."
            />
          ) : (
            <Stack spacing={1.5}>
              {data
                .slice()
                .sort((a, b) => new Date(b.submittedDate || 0) - new Date(a.submittedDate || 0))
                .slice(0, 5)
                .map((app) => (
                  <Stack
                    key={app.appId}
                    direction={{ xs: "column", md: "row" }}
                    spacing={1}
                    justifyContent="space-between"
                    alignItems={{ md: "center" }}
                    sx={{ p: 1.5, border: 1, borderColor: "divider", borderRadius: 2 }}
                  >
                    <Box>
                      <Typography fontWeight={600}>Application #{app.appId}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {app.course?.courseName || "Course not selected"} | Submitted: {formatDateTime(app.submittedDate)}
                      </Typography>
                    </Box>
                    <StatusChip status={app.status} />
                  </Stack>
                ))}
            </Stack>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
};

export default StudentDashboardPage;
