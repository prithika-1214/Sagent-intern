import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Chip, Stack, Typography } from "@mui/material";
import toast from "react-hot-toast";
import { getBorrows } from "../../api/borrowsService";
import DataTable from "../../components/DataTable";
import { useAuth } from "../../auth/AuthContext";
import { formatDate, getOverdueDays } from "../../utils/dateUtils";

export default function MemberBorrowsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [borrows, setBorrows] = useState([]);

  const loadBorrows = async () => {
    setLoading(true);
    try {
      const allBorrows = await getBorrows();
      setBorrows(allBorrows.filter((borrow) => borrow?.member?.id === user?.id));
    } catch (error) {
      toast.error(error.message || "Unable to load borrows.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBorrows();
  }, [user?.id]);

  const rows = useMemo(
    () =>
      borrows.map((borrow) => {
        const overdueDays = borrow.returnDate
          ? getOverdueDays(borrow.dueDate, borrow.returnDate)
          : getOverdueDays(borrow.dueDate);

        return {
          ...borrow,
          copyId: borrow?.bookCopy?.id || "-",
          bookTitle: borrow?.bookCopy?.book?.title || "Unknown",
          overdueDays,
          estimatedFine: overdueDays * 2,
        };
      }),
    [borrows]
  );

  return (
    <Stack spacing={2.5}>
      <Typography variant="h4" fontWeight={700}>
        My Borrows
      </Typography>

      <Alert severity="info">
        Return processing is handled by librarian. Use this page to track due date and fine risk.
      </Alert>

      <DataTable
        title="Borrowed Items"
        loading={loading}
        rows={rows}
        columns={[
          { key: "id", header: "Borrow ID" },
          { key: "bookTitle", header: "Book" },
          { key: "copyId", header: "Copy ID" },
          {
            key: "issueDate",
            header: "Issue Date",
            render: (row) => formatDate(row.issueDate),
          },
          {
            key: "dueDate",
            header: "Due Date",
            render: (row) => formatDate(row.dueDate),
          },
          {
            key: "returnDate",
            header: "Return Date",
            render: (row) => (row.returnDate ? formatDate(row.returnDate) : "-"),
          },
          {
            key: "estimatedFine",
            header: "Est. Fine",
            render: (row) => `Rs. ${row.estimatedFine.toFixed(2)}`,
          },
          {
            key: "status",
            header: "Status",
            render: (row) => (
              <Chip
                size="small"
                color={row.returnDate ? "success" : row.overdueDays > 0 ? "error" : "warning"}
                label={row.returnDate ? "Returned" : row.overdueDays > 0 ? "Overdue" : "Active"}
              />
            ),
          },
        ]}
        emptyMessage="No borrowed items found."
        renderActions={(row) =>
          row.returnDate ? (
            <Chip size="small" color="success" label="Completed" />
          ) : (
            <Button
              size="small"
              variant="outlined"
              onClick={() => toast("Contact librarian to process return.")}
            >
              Return Request
            </Button>
          )
        }
      />
    </Stack>
  );
}
