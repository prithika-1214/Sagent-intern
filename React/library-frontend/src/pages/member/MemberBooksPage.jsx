import { Alert, Button, Chip, Grid, Paper, Stack, TextField } from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { bookCopiesService, booksService, reservationsService } from "../../api/services";
import LoadingState from "../../components/common/LoadingState";
import PageHeader from "../../components/common/PageHeader";
import EntityTable from "../../components/common/EntityTable";
import { useAuth } from "../../auth/AuthContext";
import {
  computeBookAvailabilityMap,
  getBookId,
  getBookTitle,
  getStatus,
  normalizeText,
  pickFieldValue,
  recordMatchesMember,
  toIdString,
} from "../../utils/entityMappers";

function getStatusChipColor(status) {
  if (status === "Available") {
    return "success";
  }
  if (status === "Damaged") {
    return "warning";
  }
  return "default";
}

function MemberBooksPage() {
  const { currentUserId } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [books, setBooks] = useState([]);
  const [copies, setCopies] = useState([]);
  const [myReservations, setMyReservations] = useState([]);

  const [search, setSearch] = useState({
    title: "",
    author: "",
    subject: "",
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const [bookList, copyList, reservationList] = await Promise.all([
        booksService.list(),
        bookCopiesService.list(),
        reservationsService.list(),
      ]);

      setBooks(bookList);
      setCopies(copyList);
      setMyReservations(reservationList.filter((reservation) => recordMatchesMember(reservation, currentUserId)));
    } catch (loadError) {
      setError(loadError.message || "Failed to load books");
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const availabilityMap = useMemo(() => computeBookAvailabilityMap(books, copies), [books, copies]);

  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const title = normalizeText(pickFieldValue(book, ["title", "name", "bookTitle"]));
      const author = normalizeText(pickFieldValue(book, ["author", "writer"]));
      const subject = normalizeText(pickFieldValue(book, ["subject", "category", "genre"]));

      return (
        (!search.title || title.includes(normalizeText(search.title))) &&
        (!search.author || author.includes(normalizeText(search.author))) &&
        (!search.subject || subject.includes(normalizeText(search.subject)))
      );
    });
  }, [books, search]);

  const hasActiveRequest = useCallback(
    (bookId) => {
      return myReservations.some((reservation) => {
        const reservationBookId = toIdString(getBookId(reservation));
        const status = normalizeText(getStatus(reservation));
        const cancelled = status.includes("cancel");
        return reservationBookId === toIdString(bookId) && !cancelled;
      });
    },
    [myReservations]
  );

  const handleRequestBook = async (book) => {
    const bookId = getBookId(book);
    if (!bookId) {
      toast.error("Cannot request this book because its ID is missing.");
      return;
    }

    try {
      await reservationsService.create({
        memberId: currentUserId,
        bookId,
        status: "REQUESTED",
        reservationDate: new Date().toISOString().slice(0, 10),
      });

      toast.success(`Request sent for ${getBookTitle(book)}`);
      await loadData();
    } catch (requestError) {
      toast.error(requestError.message || "Failed to create reservation");
    }
  };

  if (isLoading) {
    return <LoadingState label="Loading books" />;
  }

  return (
    <>
      <PageHeader
        title="Book Search"
        subtitle="Client-side filtering over GET /books with best-effort copy availability mapping"
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

      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              label="Search by Title"
              fullWidth
              value={search.title}
              onChange={(event) => setSearch((previous) => ({ ...previous, title: event.target.value }))}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Search by Author"
              fullWidth
              value={search.author}
              onChange={(event) => setSearch((previous) => ({ ...previous, author: event.target.value }))}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Search by Subject"
              fullWidth
              value={search.subject}
              onChange={(event) => setSearch((previous) => ({ ...previous, subject: event.target.value }))}
            />
          </Grid>
        </Grid>
      </Paper>

      <EntityTable
        rows={filteredBooks}
        getRowKey={(book) => toIdString(getBookId(book)) || Math.random()}
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
            key: "availability",
            label: "Availability",
            render: (book) => {
              const availability = availabilityMap.get(toIdString(getBookId(book))) || {
                status: "Not Available",
                availableCopies: 0,
                totalCopies: 0,
              };
              return (
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip size="small" color={getStatusChipColor(availability.status)} label={availability.status} />
                  <Chip
                    size="small"
                    variant="outlined"
                    label={`${availability.availableCopies}/${availability.totalCopies || 0} copies`}
                  />
                </Stack>
              );
            },
          },
        ]}
        renderActions={(book) => {
          const bookId = getBookId(book);
          const alreadyRequested = hasActiveRequest(bookId);

          return (
            <Button
              variant="contained"
              size="small"
              disabled={!bookId || alreadyRequested}
              onClick={() => handleRequestBook(book)}
            >
              {alreadyRequested ? "Requested" : "Request"}
            </Button>
          );
        }}
        emptyTitle="No books found"
        emptyDescription="No books match your current search filters."
      />
    </>
  );
}

export default MemberBooksPage;
