import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import toast from "react-hot-toast";
import {
  createBookCopy,
  deleteBookCopy,
  getBookCopies,
  updateBookCopy,
} from "../../api/bookCopiesService";
import { getBooks } from "../../api/booksService";
import { getLibrarians } from "../../api/librariansService";
import DataTable from "../../components/DataTable";
import ConfirmDialog from "../../components/ConfirmDialog";

const schema = z.object({
  bookId: z.string().min(1, "Book is required."),
  librarianId: z.string().optional(),
  status: z.string().min(1, "Status is required."),
});

const statusOptions = ["AVAILABLE", "ISSUED", "DAMAGED", "LOST"];

function buildPayload(values) {
  const payload = {
    status: values.status,
    book: {
      id: Number(values.bookId),
    },
  };

  if (values.librarianId) {
    payload.librarian = {
      id: Number(values.librarianId),
    };
  }

  return payload;
}

export default function LibrarianBookCopiesPage() {
  const [loading, setLoading] = useState(true);
  const [copies, setCopies] = useState([]);
  const [books, setBooks] = useState([]);
  const [librarians, setLibrarians] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCopy, setEditingCopy] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      bookId: "",
      librarianId: "",
      status: "AVAILABLE",
    },
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [copiesRes, booksRes, librariansRes] = await Promise.all([
        getBookCopies(),
        getBooks(),
        getLibrarians(),
      ]);
      setCopies(copiesRes);
      setBooks(booksRes);
      setLibrarians(librariansRes);
    } catch (error) {
      toast.error(error.message || "Unable to load book copies.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const booksMap = useMemo(() => {
    const map = new Map();
    books.forEach((book) => map.set(book.id, book.title));
    return map;
  }, [books]);

  const librariansMap = useMemo(() => {
    const map = new Map();
    librarians.forEach((librarian) => map.set(librarian.id, librarian.name));
    return map;
  }, [librarians]);

  const openCreateDialog = () => {
    setEditingCopy(null);
    reset({
      bookId: "",
      librarianId: "",
      status: "AVAILABLE",
    });
    setDialogOpen(true);
  };

  const openEditDialog = (copy) => {
    setEditingCopy(copy);
    reset({
      bookId: String(copy?.book?.id || ""),
      librarianId: copy?.librarian?.id ? String(copy.librarian.id) : "",
      status: copy?.status || "AVAILABLE",
    });
    setDialogOpen(true);
  };

  const handleStatusUpdate = async (copy, nextStatus) => {
    try {
      await updateBookCopy(copy.id, {
        status: nextStatus,
        book: { id: copy?.book?.id },
        librarian: copy?.librarian?.id ? { id: copy.librarian.id } : undefined,
      });
      toast.success(`Copy #${copy.id} marked ${nextStatus}.`);
      loadData();
    } catch (error) {
      toast.error(error.message || "Unable to update copy status.");
    }
  };

  const onSubmit = async (values) => {
    try {
      const payload = buildPayload(values);
      if (editingCopy) {
        await updateBookCopy(editingCopy.id, payload);
        toast.success("Book copy updated.");
      } else {
        await createBookCopy(payload);
        toast.success("Book copy created.");
      }

      setDialogOpen(false);
      loadData();
    } catch (error) {
      toast.error(error.message || "Unable to save book copy.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    try {
      await deleteBookCopy(deleteTarget.id);
      toast.success("Book copy deleted.");
      setDeleteTarget(null);
      loadData();
    } catch (error) {
      toast.error(error.message || "Unable to delete book copy.");
    }
  };

  return (
    <Stack spacing={2.5}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1.5}>
        <Typography variant="h4" fontWeight={700}>
          Book Copies Management
        </Typography>
        <Button variant="contained" onClick={openCreateDialog}>
          Add Book Copy
        </Button>
      </Stack>

      <DataTable
        title="Book Copies"
        loading={loading}
        rows={copies}
        columns={[
          { key: "id", header: "Copy ID" },
          {
            key: "book",
            header: "Book",
            render: (row) => booksMap.get(row?.book?.id) || row?.book?.title || "-",
          },
          {
            key: "librarian",
            header: "Librarian",
            render: (row) => librariansMap.get(row?.librarian?.id) || row?.librarian?.name || "-",
          },
          {
            key: "status",
            header: "Status",
            render: (row) => {
              const status = String(row?.status || "UNKNOWN").toUpperCase();
              const color =
                status === "AVAILABLE"
                  ? "success"
                  : status === "ISSUED"
                    ? "warning"
                    : status === "DAMAGED" || status === "LOST"
                      ? "error"
                      : "default";
              return <Chip size="small" label={status} color={color} />;
            },
          },
        ]}
        renderActions={(row) => (
          <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap">
            <Button size="small" onClick={() => openEditDialog(row)}>
              Edit
            </Button>
            <Button size="small" color="warning" onClick={() => handleStatusUpdate(row, "DAMAGED")}>
              Damaged
            </Button>
            <Button size="small" color="warning" onClick={() => handleStatusUpdate(row, "LOST")}>
              Lost
            </Button>
            <Button size="small" color="error" onClick={() => setDeleteTarget(row)}>
              Delete
            </Button>
          </Stack>
        )}
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingCopy ? "Edit Book Copy" : "Create Book Copy"}</DialogTitle>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Stack spacing={2}>
              <Controller
                name="bookId"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={Boolean(errors.bookId)}>
                    <InputLabel id="book-label">Book</InputLabel>
                    <Select labelId="book-label" label="Book" {...field}>
                      {books.map((book) => (
                        <MenuItem key={book.id} value={String(book.id)}>
                          {book.title} (#{book.id})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />

              <Controller
                name="librarianId"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel id="librarian-label">Librarian</InputLabel>
                    <Select labelId="librarian-label" label="Librarian" {...field}>
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                      {librarians.map((librarian) => (
                        <MenuItem key={librarian.id} value={String(librarian.id)}>
                          {librarian.name} (#{librarian.id})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />

              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={Boolean(errors.status)}>
                    <InputLabel id="status-label">Status</InputLabel>
                    <Select labelId="status-label" label="Status" {...field}>
                      {statusOptions.map((status) => (
                        <MenuItem key={status} value={status}>
                          {status}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={isSubmitting}>
              Save
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete Book Copy"
        description="Do you want to delete this book copy?"
        confirmText="Delete"
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </Stack>
  );
}
