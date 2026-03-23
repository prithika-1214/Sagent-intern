import { useEffect, useMemo, useState } from "react";
import { Button, Chip, Stack, Typography } from "@mui/material";
import toast from "react-hot-toast";
import { getReservations, deleteReservation } from "../../api/reservationsService";
import DataTable from "../../components/DataTable";
import ConfirmDialog from "../../components/ConfirmDialog";
import { useAuth } from "../../auth/AuthContext";
import { formatDate } from "../../utils/dateUtils";

export default function MemberRequestsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState([]);
  const [selectedReservation, setSelectedReservation] = useState(null);

  const loadReservations = async () => {
    setLoading(true);
    try {
      const allReservations = await getReservations();
      const mine = allReservations.filter((item) => item?.member?.id === user?.id);
      setReservations(mine);
    } catch (error) {
      toast.error(error.message || "Unable to load requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReservations();
  }, [user?.id]);

  const rows = useMemo(
    () =>
      reservations.map((reservation) => ({
        ...reservation,
        bookTitle: reservation?.book?.title || "Unknown",
      })),
    [reservations]
  );

  const handleCancel = async () => {
    if (!selectedReservation) {
      return;
    }

    try {
      await deleteReservation(selectedReservation.id);
      toast.success("Request cancelled.");
      setSelectedReservation(null);
      loadReservations();
    } catch (error) {
      toast.error(error.message || "Unable to cancel request.");
    }
  };

  return (
    <Stack spacing={2.5}>
      <Typography variant="h4" fontWeight={700}>
        My Requests
      </Typography>

      <DataTable
        title="Reservations"
        loading={loading}
        rows={rows}
        columns={[
          { key: "id", header: "Request ID" },
          { key: "bookTitle", header: "Book" },
          {
            key: "reserveDate",
            header: "Date",
            render: (row) => formatDate(row.reserveDate),
          },
          {
            key: "status",
            header: "Status",
            render: (row) => <Chip size="small" label={row.status || "REQUESTED"} color="info" />,
          },
        ]}
        emptyMessage="No requests yet."
        renderActions={(row) => (
          <Button size="small" color="error" onClick={() => setSelectedReservation(row)}>
            Cancel
          </Button>
        )}
      />

      <ConfirmDialog
        open={Boolean(selectedReservation)}
        title="Cancel Request"
        description="Do you want to cancel this reservation request?"
        confirmText="Yes, Cancel"
        onClose={() => setSelectedReservation(null)}
        onConfirm={handleCancel}
      />
    </Stack>
  );
}
