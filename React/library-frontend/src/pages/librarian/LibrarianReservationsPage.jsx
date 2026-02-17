import { Alert, Button, Chip, Stack } from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import appConfig from "../../config/appConfig";
import {
  bookCopiesService,
  booksService,
  borrowsService,
  membersService,
  reservationsService,
} from "../../api/services";
import EntityTable from "../../components/common/EntityTable";
import LoadingState from "../../components/common/LoadingState";
import PageHeader from "../../components/common/PageHeader";
import {
  addDays,
  formatDate,
  formatDateForInput,
  todayInputValue,
} from "../../utils/dateUtils";
import {
  getBookId,
  getBookTitle,
  getCopyId,
  getDisplayName,
  getMemberId,
  getReservationId,
  getStatus,
  normalizeText,
  selectAvailableCopyForBook,
  toIdString,
  withUpdatedStatus,
} from "../../utils/entityMappers";

function statusColor(status) {
  const normalized = normalizeText(status);
  if (normalized.includes("issued") || normalized.includes("approved")) {
    return "success";
  }
  if (normalized.includes("cancel")) {
    return "default";
  }
  if (normalized.includes("request") || normalized.includes("pending")) {
    return "warning";
  }
  return "info";
}

function LibrarianReservationsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [reservations, setReservations] = useState([]);
  const [members, setMembers] = useState([]);
  const [books, setBooks] = useState([]);
  const [copies, setCopies] = useState([]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const [reservationList, memberList, bookList, copyList] = await Promise.all([
        reservationsService.list(),
        membersService.list(),
        booksService.list(),
        bookCopiesService.list(),
      ]);

      setReservations(reservationList);
      setMembers(memberList);
      setBooks(bookList);
      setCopies(copyList);
    } catch (loadError) {
      setError(loadError.message || "Failed to load reservations");
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

  const updateReservationStatus = async (reservation, nextStatus) => {
    const reservationId = getReservationId(reservation);
    if (!reservationId) {
      throw new Error("Reservation ID is missing");
    }

    await reservationsService.update(
      reservationId,
      withUpdatedStatus(
        {
          ...reservation,
          processedDate: todayInputValue(),
        },
        nextStatus
      )
    );
  };

  const handleApprove = async (reservation) => {
    try {
      await updateReservationStatus(reservation, "APPROVED");
      toast.success("Reservation approved");
      await loadData();
    } catch (approveError) {
      toast.error(approveError.message || "Failed to approve reservation");
    }
  };

  const handleCancel = async (reservation) => {
    try {
      await updateReservationStatus(reservation, "CANCELED");
      toast.success("Reservation canceled");
      await loadData();
    } catch (cancelError) {
      toast.error(cancelError.message || "Failed to cancel reservation");
    }
  };

  const handleIssue = async (reservation) => {
    const memberId = getMemberId(reservation);
    const bookId = getBookId(reservation);

    if (!memberId || !bookId) {
      toast.error("Reservation must contain memberId and bookId to issue");
      return;
    }

    const availableCopy = selectAvailableCopyForBook(bookId, copies);
    const issueDate = todayInputValue();
    const dueDate = formatDateForInput(addDays(new Date(), appConfig.defaultBorrowDays));

    try {
      const borrowPayload = {
        memberId,
        bookId,
        issueDate,
        dueDate,
        status: "ISSUED",
      };

      const copyId = availableCopy ? getCopyId(availableCopy) : null;
      if (copyId) {
        borrowPayload.copyId = copyId;
      }

      await borrowsService.create(borrowPayload);

      if (copyId) {
        await bookCopiesService.update(copyId, withUpdatedStatus({ ...availableCopy }, "BORROWED"));
      }

      await updateReservationStatus(reservation, "ISSUED");

      toast.success(copyId ? "Book issued and copy marked borrowed" : "Book issued without copy link");
      await loadData();
    } catch (issueError) {
      toast.error(issueError.message || "Failed to issue book");
    }
  };

  if (isLoading) {
    return <LoadingState label="Loading reservations" />;
  }

  return (
    <>
      <PageHeader
        title="Manage Reservations"
        subtitle="Approve, issue, or cancel reservation requests"
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
        rows={reservations}
        getRowKey={(reservation) => toIdString(getReservationId(reservation)) || toIdString(getBookId(reservation))}
        columns={[
          {
            key: "reservationId",
            label: "Reservation ID",
            render: (reservation) => toIdString(getReservationId(reservation)) || "-",
          },
          {
            key: "member",
            label: "Member",
            render: (reservation) => {
              const member = membersMap.get(toIdString(getMemberId(reservation)));
              return member ? getDisplayName(member) : `Member #${toIdString(getMemberId(reservation)) || "?"}`;
            },
          },
          {
            key: "book",
            label: "Book",
            render: (reservation) => {
              const book = booksMap.get(toIdString(getBookId(reservation)));
              return book ? getBookTitle(book) : `Book #${toIdString(getBookId(reservation)) || "?"}`;
            },
          },
          {
            key: "status",
            label: "Status",
            render: (reservation) => {
              const status = getStatus(reservation) || "REQUESTED";
              return <Chip size="small" label={status} color={statusColor(status)} />;
            },
          },
          {
            key: "reservationDate",
            label: "Requested",
            render: (reservation) => formatDate(reservation.reservationDate || reservation.createdAt),
          },
        ]}
        renderActions={(reservation) => {
          const status = normalizeText(getStatus(reservation));
          const terminal = status.includes("cancel") || status.includes("issued");

          return (
            <Stack direction="row" spacing={1}>
              <Button size="small" variant="outlined" onClick={() => handleApprove(reservation)} disabled={terminal}>
                Approve
              </Button>
              <Button size="small" variant="contained" onClick={() => handleIssue(reservation)} disabled={terminal}>
                Issue
              </Button>
              <Button
                size="small"
                color="error"
                variant="outlined"
                onClick={() => handleCancel(reservation)}
                disabled={status.includes("cancel")}
              >
                Cancel
              </Button>
            </Stack>
          );
        }}
        emptyTitle="No reservations found"
        emptyDescription="Reservation requests will appear here."
      />
    </>
  );
}

export default LibrarianReservationsPage;
