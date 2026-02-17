import { Alert, Button, Chip, Stack } from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import appConfig from "../../config/appConfig";
import {
  bookCopiesService,
  booksService,
  borrowsService,
  finesService,
  membersService,
} from "../../api/services";
import EntityTable from "../../components/common/EntityTable";
import LoadingState from "../../components/common/LoadingState";
import PageHeader from "../../components/common/PageHeader";
import EntityDialogForm from "../../components/forms/EntityDialogForm";
import { addDays, diffInDays, formatDate, formatDateForInput, parseDate, todayInputValue } from "../../utils/dateUtils";
import {
  getBookId,
  getBookTitle,
  getBorrowId,
  getCopyId,
  getDisplayName,
  getFineId,
  getMemberId,
  getStatus,
  normalizeText,
  pickFieldValue,
  toIdString,
  withUpdatedStatus,
} from "../../utils/entityMappers";
import { buildFinePayload, calculateFineForBorrow, findFineForBorrow } from "../../utils/fineUtils";

function getBorrowState(borrow) {
  const status = normalizeText(getStatus(borrow));
  if (status.includes("return")) {
    return { label: "Returned", color: "success" };
  }

  const returnDate = pickFieldValue(borrow, ["returnDate", "returnedAt"]);
  if (returnDate) {
    return { label: "Returned", color: "success" };
  }

  const dueDate = parseDate(pickFieldValue(borrow, ["dueDate", "due_date", "returnDueDate"]));
  if (!dueDate) {
    return { label: "Issued", color: "info" };
  }

  const days = diffInDays(new Date(), dueDate);
  if (days < 0) {
    return { label: `Overdue ${Math.abs(days)}d`, color: "error" };
  }
  if (days <= appConfig.dueSoonDays) {
    return { label: `Due Soon ${days}d`, color: "warning" };
  }

  return { label: "Active", color: "primary" };
}

function LibrarianBorrowsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [borrows, setBorrows] = useState([]);
  const [members, setMembers] = useState([]);
  const [books, setBooks] = useState([]);
  const [copies, setCopies] = useState([]);
  const [fines, setFines] = useState([]);
  const [isIssueDialogOpen, setIsIssueDialogOpen] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const [borrowList, memberList, bookList, copyList, fineList] = await Promise.all([
        borrowsService.list(),
        membersService.list(),
        booksService.list(),
        bookCopiesService.list(),
        finesService.list(),
      ]);

      setBorrows(borrowList);
      setMembers(memberList);
      setBooks(bookList);
      setCopies(copyList);
      setFines(fineList);
    } catch (loadError) {
      setError(loadError.message || "Failed to load borrows");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const membersMap = useMemo(
    () => new Map(members.map((member) => [toIdString(getMemberId(member)), member])),
    [members]
  );

  const booksMap = useMemo(
    () => new Map(books.map((book) => [toIdString(getBookId(book)), book])),
    [books]
  );

  const copiesMap = useMemo(
    () => new Map(copies.map((copy) => [toIdString(getCopyId(copy)), copy])),
    [copies]
  );

  const issueFields = useMemo(
    () => [
      {
        name: "memberId",
        label: "Member",
        required: true,
        options: members.map((member) => ({
          value: getMemberId(member),
          label: `${getDisplayName(member)} (${toIdString(getMemberId(member))})`,
        })),
      },
      {
        name: "bookId",
        label: "Book",
        required: true,
        options: books.map((book) => ({
          value: getBookId(book),
          label: `${getBookTitle(book)} (${toIdString(getBookId(book))})`,
        })),
      },
      {
        name: "copyId",
        label: "Copy (Optional)",
        options: copies
          .filter((copy) => {
            const status = normalizeText(getStatus(copy));
            return !status || status.includes("available");
          })
          .map((copy) => ({
            value: getCopyId(copy),
            label: `Copy ${toIdString(getCopyId(copy))} | Book ${toIdString(getBookId(copy))}`,
          })),
      },
      {
        name: "issueDate",
        label: "Issue Date",
        type: "date",
        required: true,
      },
      {
        name: "dueDate",
        label: "Due Date",
        type: "date",
        required: true,
      },
      {
        name: "status",
        label: "Status",
        options: [
          { label: "Issued", value: "ISSUED" },
          { label: "Active", value: "ACTIVE" },
        ],
      },
    ],
    [members, books, copies]
  );

  const handleIssueManual = async (payload) => {
    setIsSaving(true);
    try {
      const borrowPayload = {
        ...payload,
        status: payload.status || "ISSUED",
      };

      await borrowsService.create(borrowPayload);

      if (payload.copyId) {
        const selectedCopy = copiesMap.get(toIdString(payload.copyId));
        if (selectedCopy) {
          await bookCopiesService.update(payload.copyId, withUpdatedStatus({ ...selectedCopy }, "BORROWED"));
        }
      }

      toast.success("Borrow issued");
      setIsIssueDialogOpen(false);
      await loadData();
    } catch (issueError) {
      toast.error(issueError.message || "Failed to issue borrow");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReturn = async (borrow) => {
    const borrowId = getBorrowId(borrow);
    if (!borrowId) {
      toast.error("Borrow ID missing");
      return;
    }

    const returnDate = todayInputValue();

    try {
      await borrowsService.update(
        borrowId,
        withUpdatedStatus(
          {
            ...borrow,
            returnDate,
          },
          "RETURNED"
        )
      );

      const copyId = getCopyId(borrow);
      if (copyId) {
        const copy = copiesMap.get(toIdString(copyId));
        if (copy) {
          await bookCopiesService.update(copyId, withUpdatedStatus({ ...copy }, "AVAILABLE"));
        }
      }

      const fineSummary = calculateFineForBorrow({ ...borrow, returnDate });
      if (fineSummary.amount > 0) {
        const existingFine = findFineForBorrow(fines, borrowId);

        if (existingFine && getFineId(existingFine)) {
          await finesService.update(getFineId(existingFine), {
            ...existingFine,
            ...buildFinePayload({ borrow, memberId: getMemberId(borrow), amount: fineSummary.amount }),
          });
        } else {
          await finesService.create(buildFinePayload({ borrow, memberId: getMemberId(borrow), amount: fineSummary.amount }));
        }
      }

      toast.success("Borrow marked as returned");
      await loadData();
    } catch (returnError) {
      toast.error(returnError.message || "Failed to process return");
    }
  };

  if (isLoading) {
    return <LoadingState label="Loading borrows" />;
  }

  return (
    <>
      <PageHeader
        title="Manage Borrows"
        subtitle="Issue books, process returns, and create fines for overdue returns"
        actions={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={loadData}>
              Refresh
            </Button>
            <Button variant="contained" onClick={() => setIsIssueDialogOpen(true)}>
              Issue Borrow
            </Button>
          </Stack>
        }
      />

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      <EntityTable
        rows={borrows}
        getRowKey={(borrow) => toIdString(getBorrowId(borrow)) || toIdString(getMemberId(borrow))}
        columns={[
          {
            key: "id",
            label: "Borrow ID",
            render: (borrow) => toIdString(getBorrowId(borrow)) || "-",
          },
          {
            key: "member",
            label: "Member",
            render: (borrow) => {
              const member = membersMap.get(toIdString(getMemberId(borrow)));
              return member ? getDisplayName(member) : `Member #${toIdString(getMemberId(borrow)) || "?"}`;
            },
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
            key: "copy",
            label: "Copy ID",
            render: (borrow) => toIdString(getCopyId(borrow)) || "-",
          },
          {
            key: "issueDate",
            label: "Issue",
            render: (borrow) => formatDate(pickFieldValue(borrow, ["issueDate", "issuedAt"])),
          },
          {
            key: "dueDate",
            label: "Due",
            render: (borrow) => formatDate(pickFieldValue(borrow, ["dueDate", "due_date", "returnDueDate"])),
          },
          {
            key: "returnDate",
            label: "Returned",
            render: (borrow) => formatDate(pickFieldValue(borrow, ["returnDate", "returnedAt"])),
          },
          {
            key: "state",
            label: "State",
            render: (borrow) => {
              const state = getBorrowState(borrow);
              return <Chip size="small" color={state.color} label={state.label} />;
            },
          },
        ]}
        renderActions={(borrow) => {
          const hasReturnDate = Boolean(pickFieldValue(borrow, ["returnDate", "returnedAt"]));
          return (
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                variant="contained"
                color="success"
                disabled={hasReturnDate}
                onClick={() => handleReturn(borrow)}
              >
                Return
              </Button>
            </Stack>
          );
        }}
        emptyTitle="No borrows found"
        emptyDescription="Use Issue Borrow to create borrowing records."
      />

      <EntityDialogForm
        open={isIssueDialogOpen}
        title="Issue Borrow"
        fields={issueFields}
        defaultValues={{
          issueDate: todayInputValue(),
          dueDate: formatDateForInput(addDays(new Date(), appConfig.defaultBorrowDays)),
          status: "ISSUED",
        }}
        submitLabel="Issue"
        loading={isSaving}
        onClose={() => setIsIssueDialogOpen(false)}
        onSubmit={handleIssueManual}
      />
    </>
  );
}

export default LibrarianBorrowsPage;
