import { Alert, Button, Chip, Stack } from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { bookCopiesService, booksService } from "../../api/services";
import EntityTable from "../../components/common/EntityTable";
import LoadingState from "../../components/common/LoadingState";
import PageHeader from "../../components/common/PageHeader";
import EntityDialogForm from "../../components/forms/EntityDialogForm";
import {
  getBookId,
  getBookTitle,
  getCopyId,
  getStatus,
  normalizeText,
  pickFieldValue,
  toIdString,
  withUpdatedStatus,
} from "../../utils/entityMappers";

function BookCopiesManagementPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [copies, setCopies] = useState([]);
  const [books, setBooks] = useState([]);
  const [editingCopy, setEditingCopy] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const [copyList, bookList] = await Promise.all([bookCopiesService.list(), booksService.list()]);
      setCopies(copyList);
      setBooks(bookList);
    } catch (loadError) {
      setError(loadError.message || "Failed to load book copies");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const bookOptions = useMemo(
    () =>
      books.map((book) => ({
        value: getBookId(book),
        label: `${getBookTitle(book)} (${toIdString(getBookId(book))})`,
      })),
    [books]
  );

  const copyFields = useMemo(
    () => [
      {
        name: "bookId",
        label: "Book",
        required: true,
        options: bookOptions,
      },
      { name: "barcode", label: "Barcode" },
      {
        name: "status",
        label: "Status",
        options: [
          { label: "Available", value: "AVAILABLE" },
          { label: "Borrowed", value: "BORROWED" },
          { label: "Not Available", value: "NOT_AVAILABLE" },
          { label: "Lost", value: "LOST" },
        ],
      },
      {
        name: "condition",
        label: "Condition",
        options: [
          { label: "Good", value: "GOOD" },
          { label: "Damaged", value: "DAMAGED" },
          { label: "Lost", value: "LOST" },
        ],
      },
      { name: "location", label: "Shelf/Location" },
    ],
    [bookOptions]
  );

  const booksMap = useMemo(() => new Map(books.map((book) => [toIdString(getBookId(book)), book])), [books]);

  const openCreateDialog = () => {
    setEditingCopy(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (copy) => {
    setEditingCopy(copy);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setEditingCopy(null);
    setIsDialogOpen(false);
  };

  const handleSave = async (payload) => {
    setIsSaving(true);
    try {
      if (editingCopy) {
        const id = getCopyId(editingCopy);
        if (!id) {
          throw new Error("Book copy ID missing");
        }
        await bookCopiesService.update(id, payload);
        toast.success("Book copy updated");
      } else {
        await bookCopiesService.create(payload);
        toast.success("Book copy added");
      }
      closeDialog();
      await loadData();
    } catch (saveError) {
      toast.error(saveError.message || "Failed to save copy");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (copy) => {
    const id = getCopyId(copy);
    if (!id) {
      toast.error("Book copy ID missing");
      return;
    }

    try {
      await bookCopiesService.remove(id);
      toast.success("Book copy deleted");
      await loadData();
    } catch (deleteError) {
      toast.error(deleteError.message || "Failed to delete copy");
    }
  };

  const updateQuickStatus = async (copy, status, condition) => {
    const id = getCopyId(copy);
    if (!id) {
      toast.error("Book copy ID missing");
      return;
    }

    try {
      await bookCopiesService.update(
        id,
        withUpdatedStatus(
          {
            ...copy,
            ...(condition ? { condition } : {}),
          },
          status
        )
      );
      toast.success("Book copy status updated");
      await loadData();
    } catch (updateError) {
      toast.error(updateError.message || "Failed to update copy status");
    }
  };

  if (isLoading) {
    return <LoadingState label="Loading book copies" />;
  }

  return (
    <>
      <PageHeader
        title="Manage Book Copies"
        subtitle="CRUD over /book-copies with status/condition actions"
        actions={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={loadData}>
              Refresh
            </Button>
            <Button variant="contained" onClick={openCreateDialog}>
              Add Copy
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
        rows={copies}
        getRowKey={(copy) => toIdString(getCopyId(copy)) || toIdString(getBookId(copy))}
        columns={[
          {
            key: "copyId",
            label: "Copy ID",
            render: (copy) => toIdString(getCopyId(copy)) || "-",
          },
          {
            key: "book",
            label: "Book",
            render: (copy) => {
              const book = booksMap.get(toIdString(getBookId(copy)));
              return book ? getBookTitle(book) : `Book #${toIdString(getBookId(copy)) || "?"}`;
            },
          },
          {
            key: "status",
            label: "Status",
            render: (copy) => {
              const status = getStatus(copy) || "UNKNOWN";
              const normalized = normalizeText(status);
              const color = normalized.includes("available")
                ? "success"
                : normalized.includes("borrow")
                ? "info"
                : normalized.includes("lost") || normalized.includes("damaged")
                ? "error"
                : "default";
              return <Chip size="small" label={status} color={color} />;
            },
          },
          {
            key: "condition",
            label: "Condition",
            render: (copy) => pickFieldValue(copy, ["condition", "state"]) || "-",
          },
          {
            key: "location",
            label: "Location",
            render: (copy) => pickFieldValue(copy, ["location", "shelf", "rack"]) || "-",
          },
        ]}
        renderActions={(copy) => (
          <Stack direction="row" spacing={1}>
            <Button size="small" variant="outlined" onClick={() => openEditDialog(copy)}>
              Edit
            </Button>
            <Button size="small" variant="outlined" color="warning" onClick={() => updateQuickStatus(copy, "NOT_AVAILABLE", "DAMAGED")}>
              Damaged
            </Button>
            <Button size="small" variant="outlined" color="error" onClick={() => updateQuickStatus(copy, "LOST", "LOST")}>
              Lost
            </Button>
            <Button size="small" variant="outlined" color="success" onClick={() => updateQuickStatus(copy, "AVAILABLE", "GOOD")}>
              Available
            </Button>
            <Button size="small" color="error" variant="outlined" onClick={() => handleDelete(copy)}>
              Delete
            </Button>
          </Stack>
        )}
        emptyTitle="No book copies found"
        emptyDescription="Add copy records to support inventory-level availability."
      />

      <EntityDialogForm
        open={isDialogOpen}
        title={editingCopy ? "Edit Book Copy" : "Add Book Copy"}
        fields={copyFields}
        defaultValues={editingCopy || { status: "AVAILABLE", condition: "GOOD" }}
        submitLabel={editingCopy ? "Update" : "Create"}
        loading={isSaving}
        onClose={closeDialog}
        onSubmit={handleSave}
      />
    </>
  );
}

export default BookCopiesManagementPage;
