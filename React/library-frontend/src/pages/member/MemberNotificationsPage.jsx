import { useEffect, useMemo, useState } from "react";
import { Alert, Card, CardContent, Stack, Typography } from "@mui/material";
import toast from "react-hot-toast";
import { getBorrows } from "../../api/borrowsService";
import { useAuth } from "../../auth/AuthContext";
import { formatDate, isDueSoonBorrow, isOverdueBorrow } from "../../utils/dateUtils";

export default function MemberNotificationsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [memberBorrows, setMemberBorrows] = useState([]);

  useEffect(() => {
    async function loadBorrows() {
      setLoading(true);
      try {
        const borrows = await getBorrows();
        const mine = borrows.filter((borrow) => borrow?.member?.id === user?.id && !borrow?.returnDate);
        setMemberBorrows(mine);
      } catch (error) {
        toast.error(error.message || "Unable to load notifications.");
      } finally {
        setLoading(false);
      }
    }

    loadBorrows();
  }, [user?.id]);

  const { dueSoon, overdue } = useMemo(
    () => ({
      dueSoon: memberBorrows.filter((borrow) => isDueSoonBorrow(borrow, 2)),
      overdue: memberBorrows.filter(isOverdueBorrow),
    }),
    [memberBorrows]
  );

  return (
    <Stack spacing={2.5}>
      <Typography variant="h4" fontWeight={700}>
        Notifications
      </Typography>

      <Card elevation={0} sx={{ border: "1px solid #e4e8f0", borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Due Soon
          </Typography>
          <Stack spacing={1}>
            {loading ? <Typography color="text.secondary">Loading...</Typography> : null}
            {!loading && dueSoon.length === 0 ? (
              <Alert severity="success">No books due within 2 days.</Alert>
            ) : null}
            {dueSoon.map((borrow) => (
              <Alert key={`due-${borrow.id}`} severity="warning">
                {borrow?.bookCopy?.book?.title || "Book"} (Borrow #{borrow.id}) due on{" "}
                {formatDate(borrow.dueDate)}
              </Alert>
            ))}
          </Stack>
        </CardContent>
      </Card>

      <Card elevation={0} sx={{ border: "1px solid #e4e8f0", borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Overdue
          </Typography>
          <Stack spacing={1}>
            {loading ? <Typography color="text.secondary">Loading...</Typography> : null}
            {!loading && overdue.length === 0 ? <Alert severity="success">No overdue books.</Alert> : null}
            {overdue.map((borrow) => (
              <Alert key={`overdue-${borrow.id}`} severity="error">
                {borrow?.bookCopy?.book?.title || "Book"} (Borrow #{borrow.id}) is overdue since{" "}
                {formatDate(borrow.dueDate)}
              </Alert>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
