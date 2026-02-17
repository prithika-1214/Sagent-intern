import { Alert, Button, Chip } from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { booksService, borrowsService } from "../../api/services";
import LoadingState from "../../components/common/LoadingState";
import PageHeader from "../../components/common/PageHeader";
import EntityTable from "../../components/common/EntityTable";
import { useAuth } from "../../auth/AuthContext";
import {
  getBookId,
  getBookTitle,
  getBorrowId,
  pickFieldValue,
  recordMatchesMember,
  toIdString,
} from "../../utils/entityMappers";
import { diffInDays, formatDate, parseDate } from "../../utils/dateUtils";
import { calculateFineForBorrow } from "../../utils/fineUtils";

function getBorrowState(borrow) {
  const returnDate = pickFieldValue(borrow, ["returnDate", "returnedAt"]);
  if (returnDate) {
    return { label: "Returned", color: "success" };
  }

  const dueDateValue = pickFieldValue(borrow, ["dueDate", "due_date", "returnDueDate"]);
  const dueDate = parseDate(dueDateValue);
  if (!dueDate) {
    return { label: "Issued", color: "info" };
  }

  const daysLeft = diffInDays(new Date(), dueDate);
  if (daysLeft < 0) {
    return { label: `Overdue ${Math.abs(daysLeft)}d`, color: "error" };
  }
  if (daysLeft <= 3) {
    return { label: `Due Soon ${daysLeft}d`, color: "warning" };
  }
  return { label: "Active", color: "primary" };
}

function MemberBorrowsPage() {
  const { currentUserId } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [borrows, setBorrows] = useState([]);
  const [books, setBooks] = useState([]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const [borrowList, bookList] = await Promise.all([borrowsService.list(), booksService.list()]);
      setBorrows(borrowList.filter((borrow) => recordMatchesMember(borrow, currentUserId)));
      setBooks(bookList);
    } catch (loadError) {
      setError(loadError.message || "Failed to load borrows");
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const booksMap = useMemo(
    () => new Map(books.map((book) => [toIdString(getBookId(book)), book])),
    [books]
  );

  if (isLoading) {
    return <LoadingState label="Loading borrows" />;
  }

  return (
    <>
      <PageHeader
        title="My Borrows"
        subtitle="Track issue, due, and return dates"
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

      <EntityTable
        rows={borrows}
        getRowKey={(borrow) => toIdString(getBorrowId(borrow)) || toIdString(getBookId(borrow))}
        columns={[
          {
            key: "id",
            label: "Borrow ID",
            render: (borrow) => toIdString(getBorrowId(borrow)) || "-",
          },
          {
            key: "book",
            label: "Book",
            render: (borrow) => {
              const book = booksMap.get(toIdString(getBookId(borrow)));
              return book ? getBookTitle(book) : `Book #${toIdString(getBookId(borrow)) || "?"}`;
            },
          },
          {
            key: "issueDate",
            label: "Issue Date",
            render: (borrow) => formatDate(pickFieldValue(borrow, ["issueDate", "issuedAt"])),
          },
          {
            key: "dueDate",
            label: "Due Date",
            render: (borrow) => formatDate(pickFieldValue(borrow, ["dueDate", "due_date", "returnDueDate"])),
          },
          {
            key: "returnDate",
            label: "Return Date",
            render: (borrow) => formatDate(pickFieldValue(borrow, ["returnDate", "returnedAt"])),
          },
          {
            key: "state",
            label: "State",
            render: (borrow) => {
              const status = getBorrowState(borrow);
              return <Chip size="small" color={status.color} label={status.label} />;
            },
          },
          {
            key: "fineEstimate",
            label: "Estimated Fine",
            render: (borrow) => {
              const fine = calculateFineForBorrow(borrow);
              return fine.amount > 0 ? `$${fine.amount}` : "$0";
            },
          },
        ]}
        emptyTitle="No borrows found"
        emptyDescription="Issued books will appear here."
      />
    </>
  );
}

export default MemberBorrowsPage;
