import { Alert, Button, Grid, Paper, Stack, Typography } from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { bookCopiesService, booksService, borrowsService, finesService, reservationsService } from "../../api/services";
import LoadingState from "../../components/common/LoadingState";
import PageHeader from "../../components/common/PageHeader";
import StatCard from "../../components/common/StatCard";
import { useAuth } from "../../auth/AuthContext";
import { recordMatchesMember } from "../../utils/entityMappers";
import { filterFinesForMember } from "../../utils/fineUtils";
import { buildMemberNotifications } from "../../utils/notificationUtils";

function MemberDashboardPage() {
  const { currentUserId } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [snapshot, setSnapshot] = useState({
    books: [],
    copies: [],
    reservations: [],
    borrows: [],
    fines: [],
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const [books, copies, reservations, borrows, fines] = await Promise.all([
        booksService.list(),
        bookCopiesService.list(),
        reservationsService.list(),
        borrowsService.list(),
        finesService.list(),
      ]);

      setSnapshot({ books, copies, reservations, borrows, fines });
    } catch (loadError) {
      setError(loadError.message || "Failed to load member dashboard");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const myReservations = useMemo(
    () => snapshot.reservations.filter((reservation) => recordMatchesMember(reservation, currentUserId)),
    [snapshot.reservations, currentUserId]
  );

  const myBorrows = useMemo(
    () => snapshot.borrows.filter((borrow) => recordMatchesMember(borrow, currentUserId)),
    [snapshot.borrows, currentUserId]
  );

  const myFines = useMemo(
    () => filterFinesForMember(snapshot.fines, snapshot.borrows, currentUserId),
    [snapshot.fines, snapshot.borrows, currentUserId]
  );

  const notifications = useMemo(
    () => buildMemberNotifications({ memberId: currentUserId, borrows: snapshot.borrows, fines: snapshot.fines }),
    [currentUserId, snapshot.borrows, snapshot.fines]
  );

  const overdueCount = notifications.filter((item) => item.severity === "error").length;
  const dueSoonCount = notifications.filter((item) => item.severity === "warning").length;

  if (isLoading) {
    return <LoadingState label="Loading member dashboard" />;
  }

  return (
    <>
      <PageHeader
        title="Member Dashboard"
        subtitle="Overview of your books, reservations, borrows, fines, and reminders"
        actions={
          <Button variant="outlined" onClick={loadData}>
            Refresh
          </Button>
        }
      />

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard title="Available Catalog Books" value={snapshot.books.length} />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard title="My Reservations" value={myReservations.length} />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard title="Active Borrows" value={myBorrows.length} />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard title="My Fines" value={myFines.length} color={myFines.length ? "error.main" : "success.main"} />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard title="Due Soon" value={dueSoonCount} color={dueSoonCount ? "warning.main" : "success.main"} />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard title="Overdue" value={overdueCount} color={overdueCount ? "error.main" : "success.main"} />
        </Grid>
      </Grid>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 3 }}>
        <Button component={Link} to="/member/books" variant="contained">
          Browse Books
        </Button>
        <Button component={Link} to="/member/reservations" variant="outlined">
          View Reservations
        </Button>
        <Button component={Link} to="/member/borrows" variant="outlined">
          View Borrows
        </Button>
        <Button component={Link} to="/member/notifications" variant="outlined">
          Open Notifications
        </Button>
      </Stack>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Recent Notifications
        </Typography>

        {notifications.length ? (
          <Stack spacing={1}>
            {notifications.slice(0, 5).map((notification) => (
              <Alert key={notification.id} severity={notification.severity}>
                <Typography variant="subtitle2">{notification.title}</Typography>
                <Typography variant="body2">{notification.description}</Typography>
              </Alert>
            ))}
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No reminders right now.
          </Typography>
        )}
      </Paper>
    </>
  );
}

export default MemberDashboardPage;
