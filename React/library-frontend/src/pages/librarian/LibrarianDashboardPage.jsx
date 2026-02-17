import { Alert, Button, Grid, Stack } from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { bookCopiesService, booksService, borrowsService, finesService, reservationsService } from "../../api/services";
import LoadingState from "../../components/common/LoadingState";
import PageHeader from "../../components/common/PageHeader";
import StatCard from "../../components/common/StatCard";
import { getStatus, normalizeText } from "../../utils/entityMappers";

function LibrarianDashboardPage() {
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
      setError(loadError.message || "Failed to load librarian dashboard");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const pendingReservations = useMemo(
    () => snapshot.reservations.filter((reservation) => {
      const status = normalizeText(getStatus(reservation));
      return status.includes("request") || status.includes("pending") || status === "";
    }).length,
    [snapshot.reservations]
  );

  const overdueBorrows = useMemo(
    () => snapshot.borrows.filter((borrow) => {
      const dueDate = new Date(borrow.dueDate || borrow.returnDueDate || "");
      if (Number.isNaN(dueDate.getTime())) {
        return false;
      }
      return !borrow.returnDate && dueDate < new Date();
    }).length,
    [snapshot.borrows]
  );

  const damagedCopies = useMemo(
    () => snapshot.copies.filter((copy) => {
      const status = normalizeText(getStatus(copy));
      const condition = normalizeText(copy.condition);
      return status.includes("damaged") || status.includes("lost") || condition.includes("damaged") || condition.includes("lost");
    }).length,
    [snapshot.copies]
  );

  if (isLoading) {
    return <LoadingState label="Loading librarian dashboard" />;
  }

  return (
    <>
      <PageHeader
        title="Librarian Dashboard"
        subtitle="Inventory and circulation control center"
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
          <StatCard title="Books" value={snapshot.books.length} />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard title="Book Copies" value={snapshot.copies.length} />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard title="Pending Reservations" value={pendingReservations} color={pendingReservations ? "warning.main" : "success.main"} />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard title="Overdue Borrows" value={overdueBorrows} color={overdueBorrows ? "error.main" : "success.main"} />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard title="Damaged/Lost Copies" value={damagedCopies} color={damagedCopies ? "error.main" : "success.main"} />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard title="Fine Records" value={snapshot.fines.length} />
        </Grid>
      </Grid>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <Button component={Link} to="/librarian/books" variant="contained">
          Manage Books
        </Button>
        <Button component={Link} to="/librarian/book-copies" variant="outlined">
          Manage Book Copies
        </Button>
        <Button component={Link} to="/librarian/reservations" variant="outlined">
          Process Reservations
        </Button>
        <Button component={Link} to="/librarian/borrows" variant="outlined">
          Process Returns
        </Button>
        <Button component={Link} to="/librarian/fines" variant="outlined">
          Manage Fines
        </Button>
      </Stack>
    </>
  );
}

export default LibrarianDashboardPage;
