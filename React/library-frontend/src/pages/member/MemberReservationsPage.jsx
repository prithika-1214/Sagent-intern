import { Alert, Button, Chip } from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { booksService, reservationsService } from "../../api/services";
import LoadingState from "../../components/common/LoadingState";
import PageHeader from "../../components/common/PageHeader";
import EntityTable from "../../components/common/EntityTable";
import { useAuth } from "../../auth/AuthContext";
import {
  getBookId,
  getBookTitle,
  getReservationId,
  getStatus,
  normalizeText,
  recordMatchesMember,
  toIdString,
  withUpdatedStatus,
} from "../../utils/entityMappers";
import { formatDate } from "../../utils/dateUtils";

function statusColor(status) {
  const normalized = normalizeText(status);
  if (normalized.includes("approved") || normalized.includes("issued")) {
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

function MemberReservationsPage() {
  const { currentUserId } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [reservations, setReservations] = useState([]);
  const [books, setBooks] = useState([]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const [reservationList, bookList] = await Promise.all([reservationsService.list(), booksService.list()]);
      setReservations(reservationList.filter((item) => recordMatchesMember(item, currentUserId)));
      setBooks(bookList);
    } catch (loadError) {
      setError(loadError.message || "Failed to load reservations");
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

  const handleCancelReservation = async (reservation) => {
    const reservationId = getReservationId(reservation);
    if (!reservationId) {
      toast.error("Reservation ID is missing, cannot cancel.");
      return;
    }

    try {
      await reservationsService.remove(reservationId);
      toast.success("Reservation canceled");
      await loadData();
      return;
    } catch (deleteError) {
      try {
        await reservationsService.update(
          reservationId,
          withUpdatedStatus(
            {
              ...reservation,
              cancellationDate: new Date().toISOString().slice(0, 10),
            },
            "CANCELED"
          )
        );
        toast.success("Reservation status updated to CANCELED");
        await loadData();
      } catch (updateError) {
        toast.error(updateError.message || deleteError.message || "Failed to cancel reservation");
      }
    }
  };

  if (isLoading) {
    return <LoadingState label="Loading reservations" />;
  }

  return (
    <>
      <PageHeader
        title="My Reservations"
        subtitle="View and cancel book requests"
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
            label: "Requested On",
            render: (reservation) => formatDate(reservation.reservationDate || reservation.createdAt),
          },
        ]}
        renderActions={(reservation) => {
          const status = normalizeText(getStatus(reservation));
          const cancellable = !status.includes("cancel") && !status.includes("issued");

          return (
            <Button
              size="small"
              color="error"
              variant="outlined"
              disabled={!cancellable}
              onClick={() => handleCancelReservation(reservation)}
            >
              Cancel
            </Button>
          );
        }}
        emptyTitle="No reservations yet"
        emptyDescription="Request a book from the Books page to see reservations here."
      />
    </>
  );
}

export default MemberReservationsPage;
