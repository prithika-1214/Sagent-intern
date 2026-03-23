import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import toast from "react-hot-toast";
import { getBooks } from "../../api/booksService";
import { getBookCopies } from "../../api/bookCopiesService";
import { createReservation } from "../../api/reservationsService";
import DataTable from "../../components/DataTable";
import { useAuth } from "../../auth/AuthContext";
import { getBookAvailability } from "../../utils/availabilityUtils";
import { getTodayISO } from "../../utils/dateUtils";

export default function MemberBooksPage() {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [bookCopies, setBookCopies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [requestingBookId, setRequestingBookId] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [booksRes, copiesRes] = await Promise.all([getBooks(), getBookCopies()]);
      setBooks(booksRes);
      setBookCopies(copiesRes);
    } catch (error) {
      toast.error(error.message || "Unable to load books.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredRows = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return books
      .filter((book) => {
        if (!keyword) {
          return true;
        }
        return [book.title, book.author, book.subject]
          .join(" ")
          .toLowerCase()
          .includes(keyword);
      })
      .map((book) => ({
        ...book,
        availability: getBookAvailability(book.id, bookCopies),
      }));
  }, [books, bookCopies, search]);

  const handleRequest = async (book) => {
    setRequestingBookId(book.id);
    try {
      await createReservation({
        memberId: user.id,
        bookId: book.id,
        reserveDate: getTodayISO(),
        status: "REQUESTED",
      });
      toast.success(`Request created for "${book.title}".`);
    } catch (error) {
      toast.error(error.message || "Unable to request this book.");
    } finally {
      setRequestingBookId(null);
    }
  };

  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography variant="h4" fontWeight={700}>
          Book Search
        </Typography>
        <Typography color="text.secondary">
          Search by title, author, or subject and request available books.
        </Typography>
      </Box>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
        <TextField
          label="Search books"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          fullWidth
        />
        <Button variant="outlined" onClick={loadData}>
          Refresh
        </Button>
      </Stack>

      <DataTable
        title="Library Books"
        loading={loading}
        rows={filteredRows}
        columns={[
          { key: "id", header: "ID" },
          { key: "title", header: "Title" },
          { key: "author", header: "Author" },
          { key: "subject", header: "Subject" },
          {
            key: "availability",
            header: "Availability",
            render: (row) => (
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Chip
                  size="small"
                  label={row.availability.label}
                  color={row.availability.canRequest ? "success" : "default"}
                />
                {row.availability.damagedCount > 0 ? (
                  <Chip
                    size="small"
                    variant="outlined"
                    label={`Damaged: ${row.availability.damagedCount}`}
                    color="warning"
                  />
                ) : null}
              </Stack>
            ),
          },
        ]}
        renderActions={(row) =>
          row.availability.canRequest ? (
            <Button
              size="small"
              variant="contained"
              disabled={requestingBookId === row.id}
              onClick={() => handleRequest(row)}
            >
              Request Book
            </Button>
          ) : (
            <Chip label="Unavailable" size="small" />
          )
        }
      />
    </Stack>
  );
}
