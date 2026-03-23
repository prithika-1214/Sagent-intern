import { useEffect, useMemo, useState } from "react";
import { Button, Chip, Stack, Typography } from "@mui/material";
import toast from "react-hot-toast";
import { getBorrows } from "../../api/borrowsService";
import { getFines, updateFine } from "../../api/finesService";
import DataTable from "../../components/DataTable";
import ConfirmDialog from "../../components/ConfirmDialog";
import { useAuth } from "../../auth/AuthContext";

export default function MemberFinesPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [fines, setFines] = useState([]);
  const [payTarget, setPayTarget] = useState(null);
  const [payingFineId, setPayingFineId] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allBorrows, allFines] = await Promise.all([getBorrows(), getFines()]);
      const myBorrowIds = new Set(
        allBorrows.filter((borrow) => borrow?.member?.id === user?.id).map((borrow) => borrow.id)
      );

      const myFines = allFines.filter(
        (fine) => fine?.borrow?.member?.id === user?.id || myBorrowIds.has(fine?.borrow?.id)
      );

      setFines(myFines);
    } catch (error) {
      toast.error(error.message || "Unable to load fines.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const handlePayFine = async () => {
    if (!payTarget) {
      return;
    }

    setPayingFineId(payTarget.id);
    try {
      await updateFine(payTarget.id, {
        amount: Number(payTarget.amount || 0),
        status: "PAID",
        borrow: payTarget?.borrow?.id ? { id: payTarget.borrow.id } : payTarget.borrow,
      });
      toast.success("Fine paid successfully.");
      setPayTarget(null);
      loadData();
    } catch (error) {
      toast.error(error.message || "Unable to process payment.");
    } finally {
      setPayingFineId(null);
    }
  };

  const totalDue = useMemo(
    () =>
      fines
        .filter((fine) => String(fine?.status || "").toLowerCase() !== "paid")
        .reduce((sum, fine) => sum + Number(fine?.amount || 0), 0),
    [fines]
  );

  return (
    <Stack spacing={2.5}>
      <Typography variant="h4" fontWeight={700}>
        My Fines
      </Typography>
      <Typography color="text.secondary">Total unpaid: Rs. {totalDue.toFixed(2)}</Typography>

      <DataTable
        title="Fine Records"
        loading={loading}
        rows={fines}
        columns={[
          { key: "id", header: "Fine ID" },
          {
            key: "borrow",
            header: "Borrow ID",
            render: (row) => row?.borrow?.id ?? "-",
          },
          {
            key: "amount",
            header: "Amount",
            render: (row) => `Rs. ${Number(row.amount || 0).toFixed(2)}`,
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
          String(row?.status || "").toLowerCase() === "paid" ? (
            <Chip size="small" color="success" label="Paid" />
          ) : (
            <Button
              size="small"
              variant="contained"
              disabled={payingFineId === row.id}
              onClick={() => setPayTarget(row)}
            >
              Pay
            </Button>
          )
        }
      />

      <ConfirmDialog
        open={Boolean(payTarget)}
        title="Pay Fine"
        description={`Confirm payment of Rs. ${Number(payTarget?.amount || 0).toFixed(2)} for Fine #${
          payTarget?.id || ""
        }?`}
        confirmText="Pay Now"
        confirmColor="primary"
        onClose={() => setPayTarget(null)}
        onConfirm={handlePayFine}
      />
    </Stack>
  );
}
