import { useEffect, useState } from "react";
import { Card, CardContent, Grid, Stack, Typography } from "@mui/material";
import toast from "react-hot-toast";
import { getBooks } from "../../api/booksService";
import { getBookCopies } from "../../api/bookCopiesService";
import { getReservations } from "../../api/reservationsService";
import { getBorrows } from "../../api/borrowsService";
import { getFines } from "../../api/finesService";

function StatCard({ title, value }) {
  return (
    <Card elevation={0} sx={{ border: "1px solid #e4e8f0", borderRadius: 3 }}>
      <CardContent>
        <Typography variant="overline" color="text.secondary">
          {title}
        </Typography>
        <Typography variant="h4" fontWeight={700}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function LibrarianDashboardPage() {
  const [summary, setSummary] = useState({
    books: 0,
    copies: 0,
    requests: 0,
    activeBorrows: 0,
    unpaidFines: 0,
  });

  useEffect(() => {
    async function loadSummary() {
      try {
        const [books, copies, reservations, borrows, fines] = await Promise.all([
          getBooks(),
          getBookCopies(),
          getReservations(),
          getBorrows(),
          getFines(),
        ]);

        setSummary({
          books: books.length,
          copies: copies.length,
          requests: reservations.length,
          activeBorrows: borrows.filter((borrow) => !borrow?.returnDate).length,
          unpaidFines: fines.filter((fine) => String(fine?.status || "").toLowerCase() !== "paid").length,
        });
      } catch (error) {
        toast.error(error.message || "Unable to load dashboard.");
      }
    }

    loadSummary();
  }, []);

  return (
    <Stack spacing={2.5}>
      <Typography variant="h4" fontWeight={700}>
        Librarian Dashboard
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard title="Books" value={summary.books} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard title="Book Copies" value={summary.copies} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard title="Reservations" value={summary.requests} />
        </Grid>
        <Grid item xs={12} sm={6} md={6}>
          <StatCard title="Active Borrows" value={summary.activeBorrows} />
        </Grid>
        <Grid item xs={12} sm={6} md={6}>
          <StatCard title="Unpaid Fines" value={summary.unpaidFines} />
        </Grid>
      </Grid>
    </Stack>
  );
}
