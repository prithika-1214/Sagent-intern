import { useEffect, useState } from "react";
import { Button, Chip, Stack, Typography } from "@mui/material";
import toast from "react-hot-toast";
import { getFines, updateFine } from "../../api/finesService";
import DataTable from "../../components/DataTable";

export default function LibrarianFinesPage() {
  const [loading, setLoading] = useState(true);
  const [fines, setFines] = useState([]);

  const loadFines = async () => {
    setLoading(true);
    try {
      setFines(await getFines());
    } catch (error) {
      toast.error(error.message || "Unable to load fines.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFines();
  }, []);

  const markPaid = async (fine) => {
    try {
      await updateFine(fine.id, {
        amount: fine.amount,
        status: "PAID",
        borrow: fine?.borrow?.id ? { id: fine.borrow.id } : undefined,
      });
      toast.success("Fine marked as PAID.");
      loadFines();
    } catch (error) {
      toast.error(error.message || "Unable to update fine.");
    }
  };

  return (
    <Stack spacing={2.5}>
      <Typography variant="h4" fontWeight={700}>
        Fine Management
      </Typography>

      <DataTable
        title="All Fines"
        loading={loading}
        rows={fines}
        columns={[
          { key: "id", header: "Fine ID" },
          {
            key: "borrow",
            header: "Borrow ID",
            render: (row) => row?.borrow?.id || "-",
          },
          {
            key: "member",
            header: "Member",
            render: (row) => row?.borrow?.member?.name || "-",
          },
          {
            key: "amount",
            header: "Amount",
            render: (row) => `Rs. ${Number(row?.amount || 0).toFixed(2)}`,
          },
          {
            key: "status",
            header: "Status",
            render: (row) => (
              <Chip
                size="small"
                label={row.status || "UNPAID"}
                color={String(row.status || "").toLowerCase() === "paid" ? "success" : "warning"}
              />
            ),
          },
        ]}
        emptyMessage="No fines found."
        renderActions={(row) =>
          String(row.status || "").toLowerCase() === "paid" ? (
            <Chip size="small" label="Settled" color="success" />
          ) : (
            <Button size="small" variant="contained" onClick={() => markPaid(row)}>
              Mark Paid
            </Button>
          )
        }
      />
    </Stack>
  );
}
