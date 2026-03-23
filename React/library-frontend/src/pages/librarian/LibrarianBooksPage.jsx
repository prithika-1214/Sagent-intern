import { useEffect, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import toast from "react-hot-toast";
import { createBook, deleteBook, getBooks, updateBook } from "../../api/booksService";
import { getBookCopies, deleteBookCopy } from "../../api/bookCopiesService";
import { getReservations, deleteReservation } from "../../api/reservationsService";
import { getBorrows, deleteBorrow } from "../../api/borrowsService";
import { getFines, deleteFine } from "../../api/finesService";
import DataTable from "../../components/DataTable";
import ConfirmDialog from "../../components/ConfirmDialog";

const schema = z.object({
  title: z.string().min(1, "Title is required."),
  author: z.string().min(1, "Author is required."),
  subject: z.string().min(1, "Subject is required."),
});

export default function LibrarianBooksPage() {
  const [loading, setLoading] = useState(true);
  const [books, setBooks] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingBookId, setDeletingBookId] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      author: "",
      subject: "",
    },
  });

  const loadBooks = async () => {
    setLoading(true);
    try {
      setBooks(await getBooks());
    } catch (error) {
      toast.error(error.message || "Unable to load books.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooks();
  }, []);

  const openCreateDialog = () => {
    setEditingBook(null);
    reset({ title: "", author: "", subject: "" });
    setDialogOpen(true);
  };

  const openEditDialog = (book) => {
    setEditingBook(book);
    reset({
      title: book.title || "",
      author: book.author || "",
      subject: book.subject || "",
    });
    setDialogOpen(true);
  };

  const onSubmit = async (values) => {
    try {
      const payload = {
        title: values.title.trim(),
        author: values.author.trim(),
        subject: values.subject.trim(),
      };

      if (editingBook) {
        await updateBook(editingBook.id, payload);
        toast.success("Book updated.");
      } else {
        await createBook(payload);
        toast.success("Book created.");
      }

      setDialogOpen(false);
      loadBooks();
    } catch (error) {
      toast.error(error.message || "Unable to save book.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    setDeletingBookId(deleteTarget.id);
    try {
      const [reservations, copies, borrows, fines] = await Promise.all([
        getReservations(),
        getBookCopies(),
        getBorrows(),
        getFines(),
      ]);

      const bookId = deleteTarget.id;
      const relatedReservations = reservations.filter((item) => item?.book?.id === bookId);
      const relatedCopies = copies.filter((item) => item?.book?.id === bookId);
      const relatedCopyIds = new Set(relatedCopies.map((item) => item.id));
      const relatedBorrows = borrows.filter((item) => relatedCopyIds.has(item?.bookCopy?.id));
      const relatedBorrowIds = new Set(relatedBorrows.map((item) => item.id));
      const relatedFines = fines.filter((item) => relatedBorrowIds.has(item?.borrow?.id));

      for (const fine of relatedFines) {
        await deleteFine(fine.id);
      }

      for (const borrow of relatedBorrows) {
        await deleteBorrow(borrow.id);
      }

      for (const reservation of relatedReservations) {
        await deleteReservation(reservation.id);
      }

      for (const copy of relatedCopies) {
        await deleteBookCopy(copy.id);
      }

      await deleteBook(deleteTarget.id);
      toast.success("Book deleted successfully.");
      setDeleteTarget(null);
      loadBooks();
    } catch (error) {
      toast.error(error.message || "Unable to delete book.");
    } finally {
      setDeletingBookId(null);
    }
  };

  return (
    <Stack spacing={2.5}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1.5}>
        <Typography variant="h4" fontWeight={700}>
          Books Management
        </Typography>
        <Button variant="contained" onClick={openCreateDialog}>
          Add Book
        </Button>
      </Stack>

      <DataTable
        title="Books"
        loading={loading}
        rows={books}
        columns={[
          { key: "id", header: "ID" },
          { key: "title", header: "Title" },
          { key: "author", header: "Author" },
          { key: "subject", header: "Subject" },
        ]}
        emptyMessage="No books found."
        renderActions={(row) => (
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button size="small" onClick={() => openEditDialog(row)}>
              Edit
            </Button>
            <Button
              size="small"
              color="error"
              disabled={deletingBookId === row.id}
              onClick={() => setDeleteTarget(row)}
            >
              Delete
            </Button>
          </Stack>
        )}
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingBook ? "Edit Book" : "Create Book"}</DialogTitle>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Stack spacing={2}>
              <TextField
                label="Title"
                fullWidth
                {...register("title")}
                error={Boolean(errors.title)}
                helperText={errors.title?.message}
              />
              <TextField
                label="Author"
                fullWidth
                {...register("author")}
                error={Boolean(errors.author)}
                helperText={errors.author?.message}
              />
              <TextField
                label="Subject"
                fullWidth
                {...register("subject")}
                error={Boolean(errors.subject)}
                helperText={errors.subject?.message}
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
        title="Delete Book"
        description="This will delete the selected book and its related copies, reservations, borrows, and fines."
        confirmText={deletingBookId ? "Deleting..." : "Delete"}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </Stack>
  );
}
