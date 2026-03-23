import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import toast from "react-hot-toast";
import { createBorrow } from "../../api/borrowsService";
import { getBookCopies, updateBookCopy } from "../../api/bookCopiesService";
import { deleteReservation, getReservations } from "../../api/reservationsService";
import DataTable from "../../components/DataTable";
import { getTodayISO, addDaysISO, formatDate } from "../../utils/dateUtils";
import { isCopyAvailable, isCopyDamaged, isCopyLost } from "../../utils/availabilityUtils";

const schema = z.object({
  copyId: z.string().min(1, "Select a book copy."),
  dueDate: z.string().min(1, "Due date is required."),
});

function normalizeReservationStatus(status) {
  const normalized = String(status || "").trim().toUpperCase();
  return normalized || "REQUESTED";
}

function isIssuableReservation(reservation) {
  const status = normalizeReservationStatus(reservation?.status);
  return status === "REQUESTED" || status === "PENDING";
}

function isCopyIssuableForRequest(copy) {
  return !isCopyDamaged(copy) && !isCopyLost(copy);
}

export default function LibrarianRequestsPage() {
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState([]);
  const [copies, setCopies] = useState([]);
  const [issueTarget, setIssueTarget] = useState(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      copyId: "",
      dueDate: addDaysISO(14),
    },
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [reservationsRes, copiesRes] = await Promise.all([getReservations(), getBookCopies()]);
      setReservations(reservationsRes);
      setCopies(copiesRes);
    } catch (error) {
      toast.error(error.message || "Unable to load reservations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const issuableCopiesForTarget = useMemo(() => {
    if (!issueTarget?.book?.id) {
      return [];
    }

    return copies.filter(
      (copy) => copy?.book?.id === issueTarget.book.id && isCopyIssuableForRequest(copy)
    );
  }, [issueTarget, copies]);

  const openIssueDialog = (reservation) => {
    if (!isIssuableReservation(reservation)) {
      toast.error("Cancelled or closed requests cannot be issued.");
      return;
    }

    setIssueTarget(reservation);
    const firstAvailableCopy = copies.find(
      (copy) => copy?.book?.id === reservation?.book?.id && isCopyAvailable(copy)
    );
    const firstEligibleCopy =
      firstAvailableCopy ||
      copies.find(
        (copy) => copy?.book?.id === reservation?.book?.id && isCopyIssuableForRequest(copy)
      );
    reset({
      copyId: firstEligibleCopy ? String(firstEligibleCopy.id) : "",
      dueDate: addDaysISO(14),
    });
  };

  const closeIssueDialog = () => {
    setIssueTarget(null);
    reset({
      copyId: "",
      dueDate: addDaysISO(14),
    });
  };

  const onIssue = async (values) => {
    if (!issueTarget) {
      return;
    }

    if (!isIssuableReservation(issueTarget)) {
      toast.error("This request is not issuable.");
      closeIssueDialog();
      return;
    }

    const copy = copies.find(
      (item) =>
        item.id === Number(values.copyId) &&
        item?.book?.id === issueTarget?.book?.id &&
        isCopyIssuableForRequest(item)
    );

    if (!copy) {
      toast.error("Selected copy is not eligible for issuing.");
      return;
    }

    try {
      await createBorrow({
        memberId: issueTarget?.member?.id,
        copyId: Number(values.copyId),
        issueDate: getTodayISO(),
        dueDate: values.dueDate,
      });

      await updateBookCopy(copy.id, {
        status: "ISSUED",
        book: { id: copy?.book?.id },
        librarian: copy?.librarian?.id ? { id: copy.librarian.id } : undefined,
      });

      await deleteReservation(issueTarget.id);

      toast.success("Book issued successfully.");
      closeIssueDialog();
      loadData();
    } catch (error) {
      toast.error(error.message || "Unable to issue book.");
    }
  };

  return (
    <Stack spacing={2.5}>
      <Typography variant="h4" fontWeight={700}>
        Reservation Requests
      </Typography>

      <DataTable
        title="All Reservations"
        loading={loading}
        rows={reservations}
        columns={[
          { key: "id", header: "Request ID" },
          {
            key: "member",
            header: "Member",
            render: (row) => `${row?.member?.name || "Member"} (#${row?.member?.id || "-"})`,
          },
          {
            key: "book",
            header: "Book",
            render: (row) => `${row?.book?.title || "Book"} (#${row?.book?.id || "-"})`,
          },
          {
            key: "reserveDate",
            header: "Reserve Date",
            render: (row) => formatDate(row.reserveDate),
          },
          { key: "status", header: "Status" },
        ]}
        emptyMessage="No reservations pending."
        renderActions={(row) => (
          <Button
            size="small"
            variant="contained"
            disabled={
              !isIssuableReservation(row) ||
              !copies.some(
                (copy) => copy?.book?.id === row?.book?.id && isCopyIssuableForRequest(copy)
              )
            }
            onClick={() => openIssueDialog(row)}
          >
            Issue
          </Button>
        )}
      />

      <Dialog open={Boolean(issueTarget)} onClose={closeIssueDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Issue Book</DialogTitle>
        <Box component="form" onSubmit={handleSubmit(onIssue)}>
          <DialogContent>
            <Stack spacing={2}>
              <Typography color="text.secondary">
                Member: {issueTarget?.member?.name || "-"} (#{issueTarget?.member?.id || "-"})
              </Typography>
              <Typography color="text.secondary">
                Book: {issueTarget?.book?.title || "-"} (#{issueTarget?.book?.id || "-"})
              </Typography>

              <Controller
                name="copyId"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={Boolean(errors.copyId)}>
                    <InputLabel id="copy-id-label">Available Copy</InputLabel>
                    <Select labelId="copy-id-label" label="Available Copy" {...field}>
                      {issuableCopiesForTarget.map((copy) => (
                        <MenuItem key={copy.id} value={String(copy.id)}>
                          Copy #{copy.id} ({String(copy?.status || "UNKNOWN").toUpperCase()})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />

              <Controller
                name="dueDate"
                control={control}
                render={({ field }) => (
                  <TextField
                    label="Due Date"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    error={Boolean(errors.dueDate)}
                    helperText={errors.dueDate?.message}
                    {...field}
                  />
                )}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeIssueDialog}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting || issuableCopiesForTarget.length === 0}
            >
              Issue Book
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Stack>
  );
}
