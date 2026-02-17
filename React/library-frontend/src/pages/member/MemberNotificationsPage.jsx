import { Alert, Button, Paper, Stack, Typography } from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { borrowsService, finesService } from "../../api/services";
import EmptyState from "../../components/common/EmptyState";
import LoadingState from "../../components/common/LoadingState";
import PageHeader from "../../components/common/PageHeader";
import { useAuth } from "../../auth/AuthContext";
import { buildMemberNotifications } from "../../utils/notificationUtils";

function MemberNotificationsPage() {
  const { currentUserId } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [borrows, setBorrows] = useState([]);
  const [fines, setFines] = useState([]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const [borrowList, fineList] = await Promise.all([borrowsService.list(), finesService.list()]);
      setBorrows(borrowList);
      setFines(fineList);
    } catch (loadError) {
      setError(loadError.message || "Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const notifications = useMemo(
    () => buildMemberNotifications({ memberId: currentUserId, borrows, fines }),
    [currentUserId, borrows, fines]
  );

  if (isLoading) {
    return <LoadingState label="Loading notifications" />;
  }

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="Client-side due-soon and overdue reminders"
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

      {!notifications.length ? (
        <EmptyState title="No reminders" description="All good. You have no due-soon or overdue notices." />
      ) : (
        <Paper sx={{ p: 2 }}>
          <Stack spacing={1.5}>
            {notifications.map((notification) => (
              <Alert key={notification.id} severity={notification.severity}>
                <Typography variant="subtitle2">{notification.title}</Typography>
                <Typography variant="body2">{notification.description}</Typography>
              </Alert>
            ))}
          </Stack>
        </Paper>
      )}
    </>
  );
}

export default MemberNotificationsPage;
