import { useEffect, useMemo, useState } from "react";
import { Button, Chip, Stack, Typography } from "@mui/material";
import toast from "react-hot-toast";
import { createFine, getFines } from "../../api/finesService";
import { getBorrows, updateBorrow } from "../../api/borrowsService";
import { getBookCopies, updateBookCopy } from "../../api/bookCopiesService";
import DataTable from "../../components/DataTable";
import ConfirmDialog from "../../components/ConfirmDialog";
import { formatDate, getOverdueDays, getTodayISO } from "../../utils/dateUtils";

export default function LibrarianBorrowsPage() {
  const [loading, setLoading] = useState(true);
  const [borrows, setBorrows] = useState([]);
  const [copies, setCopies] = useState([]);
  const [fines, setFines] = useState([]);
  const [returnTarget, setReturnTarget] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [borrowsRes, copiesRes, finesRes] = await Promise.all([
        getBorrows(),
        getBookCopies(),
        getFines(),
      ]);
      setBorrows(borrowsRes);
      setCopies(copiesRes);
      setFines(finesRes);
    } catch (error) {
      toast.error(error.message || "Unable to load borrows.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const fineByBorrowId = useMemo(() => {
    const map = new Map();
    fines.forEach((fine) => {
      if (fine?.borrow?.id) {
        map.set(fine.borrow.id, fine);
      }
    });
    return map;
  }, [fines]);

  const processReturn = async () => {
    if (!returnTarget) {
      return;
    }

    const today = getTodayISO();
    const borrowId = returnTarget.id;
    const copyId = returnTarget?.bookCopy?.id;

    try {
      await updateBorrow(borrowId, {
        memberId: returnTarget?.member?.id,
        copyId,
        issueDate: returnTarget.issueDate,
        dueDate: returnTarget.dueDate,
        returnDate: today,
      });

      const copy = copies.find((item) => item.id === copyId) || returnTarget.bookCopy;
      if (copy?.id) {
        await updateBookCopy(copy.id, {
          status: "AVAILABLE",
          book: { id: copy?.book?.id },
          librarian: copy?.librarian?.id ? { id: copy.librarian.id } : undefined,
        });
      }

      const overdueDays = getOverdueDays(returnTarget.dueDate, today);
      const existingFine = fines.find((fine) => fine?.borrow?.id === borrowId);
      if (overdueDays > 0 && !existingFine) {
        const amount = overdueDays * 2;
        await createFine({
          amount,
          status: "UNPAID",
          borrow: { id: borrowId },
        });
        toast(`Overdue fine created: Rs. ${amount.toFixed(2)}`);
      }

      toast.success("Book returned successfully.");
      setReturnTarget(null);
      loadData();
    } catch (error) {
      toast.error(error.message || "Unable to process return.");
    }
  };

  return (
    <Stack spacing={2.5}>
      <Typography variant="h4" fontWeight={700}>
        Borrow Management
      </Typography>

      <DataTable
        title="All Borrow Records"
        loading={loading}
        rows={borrows}
        columns={[
          { key: "id", header: "Borrow ID" },
          {
            key: "member",
            header: "Member",
            render: (row) => `${row?.member?.name || "Member"} (#${row?.member?.id || "-"})`,
          },
          {
            key: "book",
            header: "Book",
            render: (row) => row?.bookCopy?.book?.title || "-",
          },
          {
            key: "copyId",
            header: "Copy ID",
            render: (row) => row?.bookCopy?.id || "-",
          },
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
            key: "fine",
            header: "Fine",
            render: (row) =>
              fineByBorrowId.has(row.id)
                ? `Rs. ${Number(fineByBorrowId.get(row.id)?.amount || 0).toFixed(2)}`
                : "-",
          },
          {
            key: "status",
            header: "Status",
            render: (row) => (
              <Chip
                size="small"
                color={row.returnDate ? "success" : "warning"}
                label={row.returnDate ? "Returned" : "Active"}
              />
            ),
          },
        ]}
        renderActions={(row) =>
          row.returnDate ? (
            <Chip size="small" color="success" label="Completed" />
          ) : (
            <Button size="small" variant="contained" onClick={() => setReturnTarget(row)}>
              Return
            </Button>
          )
        }
      />

      <ConfirmDialog
        open={Boolean(returnTarget)}
        title="Process Return"
        description="Mark this borrow as returned and calculate fine if overdue?"
        confirmText="Process Return"
        confirmColor="primary"
        onClose={() => setReturnTarget(null)}
        onConfirm={processReturn}
      />
    </Stack>
  );
}
