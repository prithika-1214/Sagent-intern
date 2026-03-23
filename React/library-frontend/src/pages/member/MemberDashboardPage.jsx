import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import toast from "react-hot-toast";
import { getBorrows } from "../../api/borrowsService";
import { getReservations } from "../../api/reservationsService";
import { getFines } from "../../api/finesService";
import { useAuth } from "../../auth/AuthContext";
import { isDueSoonBorrow, isOverdueBorrow } from "../../utils/dateUtils";

function StatCard({ label, value }) {
  return (
    <Card elevation={0} sx={{ border: "1px solid #e4e8f0", borderRadius: 3 }}>
      <CardContent>
        <Typography variant="overline" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h4" fontWeight={700}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function MemberDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toastSentRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    activeBorrows: 0,
    pendingRequests: 0,
    unpaidFines: 0,
    dueSoon: 0,
    overdue: 0,
  });

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      try {
        const [borrows, reservations, fines] = await Promise.all([
          getBorrows(),
          getReservations(),
          getFines(),
        ]);

        const memberBorrows = borrows.filter((borrow) => borrow?.member?.id === user?.id);
        const activeBorrows = memberBorrows.filter((borrow) => !borrow?.returnDate);
        const dueSoonBorrows = activeBorrows.filter((borrow) => isDueSoonBorrow(borrow, 2));
        const overdueBorrows = activeBorrows.filter(isOverdueBorrow);

        const memberReservations = reservations.filter(
          (reservation) => reservation?.member?.id === user?.id
        );

        const memberBorrowIds = new Set(memberBorrows.map((borrow) => borrow.id));
        const memberFines = fines.filter(
          (fine) =>
            fine?.borrow?.member?.id === user?.id || memberBorrowIds.has(fine?.borrow?.id)
        );
        const unpaidFines = memberFines.filter(
          (fine) => String(fine?.status || "").toLowerCase() !== "paid"
        );

        setSummary({
          activeBorrows: activeBorrows.length,
          pendingRequests: memberReservations.length,
          unpaidFines: unpaidFines.length,
          dueSoon: dueSoonBorrows.length,
          overdue: overdueBorrows.length,
        });

        if (!toastSentRef.current) {
          if (dueSoonBorrows.length > 0) {
            toast(`Reminder: ${dueSoonBorrows.length} book(s) due within 2 days.`);
          }
          if (overdueBorrows.length > 0) {
            toast.error(`Alert: ${overdueBorrows.length} overdue book(s).`);
          }
          toastSentRef.current = true;
        }
      } catch (error) {
        toast.error(error.message || "Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [user?.id]);

  const reminders = useMemo(() => {
    const list = [];
    if (summary.overdue > 0) {
      list.push({ severity: "error", message: `${summary.overdue} item(s) are overdue.` });
    }
    if (summary.dueSoon > 0) {
      list.push({
        severity: "warning",
        message: `${summary.dueSoon} item(s) are due within 2 days.`,
      });
    }
    if (list.length === 0) {
      list.push({ severity: "success", message: "No urgent notifications right now." });
    }
    return list;
  }, [summary]);

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" fontWeight={700}>
          Member Dashboard
        </Typography>
        <Typography color="text.secondary">Welcome back, {user?.name}</Typography>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Active Borrows" value={loading ? "..." : summary.activeBorrows} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Pending Requests" value={loading ? "..." : summary.pendingRequests} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Unpaid Fines" value={loading ? "..." : summary.unpaidFines} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Due Soon" value={loading ? "..." : summary.dueSoon} />
        </Grid>
      </Grid>

      <Card elevation={0} sx={{ border: "1px solid #e4e8f0", borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Due Date Reminders
          </Typography>
          <Stack spacing={1.4}>
            {reminders.map((item) => (
              <Alert key={item.message} severity={item.severity}>
                {item.message}
              </Alert>
            ))}
          </Stack>
        </CardContent>
      </Card>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
        <Button variant="contained" onClick={() => navigate("/member/books")}>
          Search Books
        </Button>
        <Button variant="outlined" onClick={() => navigate("/member/requests")}>
          View Requests
        </Button>
        <Button variant="outlined" onClick={() => navigate("/member/notifications")}>
          Notifications
        </Button>
      </Stack>
    </Stack>
  );
}
