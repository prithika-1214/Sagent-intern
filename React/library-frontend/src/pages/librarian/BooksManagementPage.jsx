import { Alert, Button, Stack } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { booksService } from "../../api/services";
import EntityTable from "../../components/common/EntityTable";
import LoadingState from "../../components/common/LoadingState";
import PageHeader from "../../components/common/PageHeader";
import EntityDialogForm from "../../components/forms/EntityDialogForm";
import { getBookId, getBookTitle, pickFieldValue, toIdString } from "../../utils/entityMappers";

const bookFields = [
  { name: "title", label: "Title", required: true },
  { name: "author", label: "Author", required: true },
  { name: "subject", label: "Subject" },
  { name: "isbn", label: "ISBN" },
  { name: "publisher", label: "Publisher" },
  { name: "publishedYear", label: "Published Year", type: "number" },
  {
    name: "status",
    label: "Status",
    options: [
      { label: "Available", value: "AVAILABLE" },
      { label: "Not Available", value: "NOT_AVAILABLE" },
      { label: "Archived", value: "ARCHIVED" },
    ],
  },
];

function BooksManagementPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [books, setBooks] = useState([]);
  const [editingBook, setEditingBook] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const list = await booksService.list();
      setBooks(list);
    } catch (loadError) {
      setError(loadError.message || "Failed to load books");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const closeDialog = () => {
    setEditingBook(null);
    setIsDialogOpen(false);
  };

  const openCreateDialog = () => {
    setEditingBook(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (book) => {
    setEditingBook(book);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (payload) => {
    setIsSaving(true);
    try {
      if (editingBook) {
        const id = getBookId(editingBook);
        if (!id) {
          throw new Error("Book ID missing for update");
        }
        await booksService.update(id, payload);
        toast.success("Book updated");
      } else {
        await booksService.create(payload);
        toast.success("Book added");
      }
      closeDialog();
      await loadData();
    } catch (saveError) {
      toast.error(saveError.message || "Failed to save book");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (book) => {
    const id = getBookId(book);
    if (!id) {
      toast.error("Book ID is missing");
      return;
    }

    try {
      await booksService.remove(id);
      toast.success("Book deleted");
      await loadData();
    } catch (deleteError) {
      toast.error(deleteError.message || "Failed to delete book");
    }
  };

  if (isLoading) {
    return <LoadingState label="Loading books" />;
  }

  return (
    <>
      <PageHeader
        title="Manage Books"
        subtitle="CRUD over /books"
        actions={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={loadData}>
              Refresh
            </Button>
            <Button variant="contained" onClick={openCreateDialog}>
              Add Book
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
        rows={books}
        getRowKey={(book) => toIdString(getBookId(book)) || getBookTitle(book)}
        columns={[
          {
            key: "id",
            label: "Book ID",
            render: (book) => toIdString(getBookId(book)) || "-",
          },
          {
            key: "title",
            label: "Title",
            render: (book) => getBookTitle(book),
          },
          {
            key: "author",
            label: "Author",
            render: (book) => pickFieldValue(book, ["author", "writer", "creator"]) || "-",
          },
          {
            key: "subject",
            label: "Subject",
            render: (book) => pickFieldValue(book, ["subject", "category", "genre"]) || "-",
          },
          {
            key: "status",
            label: "Status",
            render: (book) => pickFieldValue(book, ["status", "availabilityStatus"]) || "-",
          },
        ]}
        renderActions={(book) => (
          <Stack direction="row" spacing={1}>
            <Button size="small" variant="outlined" onClick={() => openEditDialog(book)}>
              Edit
            </Button>
            <Button size="small" color="error" variant="outlined" onClick={() => handleDelete(book)}>
              Delete
            </Button>
          </Stack>
        )}
        emptyTitle="No books found"
        emptyDescription="Use Add Book to create a new record."
      />

      <EntityDialogForm
        open={isDialogOpen}
        title={editingBook ? "Edit Book" : "Add Book"}
        fields={bookFields}
        defaultValues={editingBook || { status: "AVAILABLE" }}
        submitLabel={editingBook ? "Update" : "Create"}
        loading={isSaving}
        onClose={closeDialog}
        onSubmit={handleSubmit}
      />
    </>
  );
}

export default BooksManagementPage;
