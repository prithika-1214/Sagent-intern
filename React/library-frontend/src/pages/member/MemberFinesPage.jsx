import { Alert, Button, Chip, Stack, Typography } from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { borrowsService, finesService } from "../../api/services";
import LoadingState from "../../components/common/LoadingState";
import PageHeader from "../../components/common/PageHeader";
import EntityTable from "../../components/common/EntityTable";
import { useAuth } from "../../auth/AuthContext";
import { formatDate } from "../../utils/dateUtils";
import { getBorrowId, getFineId, getStatus, normalizeText, recordMatchesMember, toIdString } from "../../utils/entityMappers";
import { calculateFineForBorrow, filterFinesForMember } from "../../utils/fineUtils";

function MemberFinesPage() {
  const { currentUserId } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [fines, setFines] = useState([]);
  const [borrows, setBorrows] = useState([]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const [fineList, borrowList] = await Promise.all([finesService.list(), borrowsService.list()]);
      setFines(fineList);
      setBorrows(borrowList);
    } catch (loadError) {
      setError(loadError.message || "Failed to load fines");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const myBorrows = useMemo(
    () => borrows.filter((borrow) => recordMatchesMember(borrow, currentUserId)),
    [borrows, currentUserId]
  );

  const myFines = useMemo(
    () => filterFinesForMember(fines, borrows, currentUserId),
    [fines, borrows, currentUserId]
  );

  const missingFineEstimates = useMemo(() => {
    const fineBorrowIds = new Set(myFines.map((fine) => toIdString(getBorrowId(fine))));

    return myBorrows
      .map((borrow) => {
        const estimate = calculateFineForBorrow(borrow);
        return { borrow, estimate };
      })
      .filter(
        ({ borrow, estimate }) =>
          estimate.amount > 0 && !fineBorrowIds.has(toIdString(getBorrowId(borrow)))
      );
  }, [myBorrows, myFines]);

  if (isLoading) {
    return <LoadingState label="Loading fines" />;
  }

  return (
    <>
      <PageHeader
        title="My Fines"
        subtitle="Persisted fines from /fines plus fallback overdue estimates"
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

      {missingFineEstimates.length ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {missingFineEstimates.length} overdue borrow(s) have no persisted fine record yet. Estimated fines are shown below.
        </Alert>
      ) : null}

      <EntityTable
        rows={myFines}
        getRowKey={(fine) => toIdString(getFineId(fine)) || toIdString(getBorrowId(fine))}
        columns={[
          {
            key: "fineId",
            label: "Fine ID",
            render: (fine) => toIdString(getFineId(fine)) || "-",
          },
          {
            key: "borrowId",
            label: "Borrow ID",
            render: (fine) => toIdString(getBorrowId(fine)) || "-",
          },
          {
            key: "amount",
            label: "Amount",
            render: (fine) => `$${fine.amount ?? 0}`,
          },
          {
            key: "status",
            label: "Status",
            render: (fine) => {
              const status = getStatus(fine) || "UNPAID";
              const color = normalizeText(status).includes("paid") ? "success" : "warning";
              return <Chip size="small" color={color} label={status} />;
            },
          },
          {
            key: "issuedDate",
            label: "Issued",
            render: (fine) => formatDate(fine.issuedDate || fine.createdAt),
          },
          {
            key: "paidDate",
            label: "Paid",
            render: (fine) => formatDate(fine.paidDate),
          },
        ]}
        emptyTitle="No fines found"
        emptyDescription="You have no persisted fine records."
      />

      {missingFineEstimates.length ? (
        <Stack spacing={1} sx={{ mt: 2 }}>
          <Typography variant="h6">Fallback Overdue Estimates</Typography>
          {missingFineEstimates.map(({ borrow, estimate }) => (
            <Alert severity="info" key={`estimate-${getBorrowId(borrow)}`}>
              Borrow #{getBorrowId(borrow)} estimated fine: ${estimate.amount} ({estimate.overdueDays} overdue day(s)).
            </Alert>
          ))}
        </Stack>
      ) : null}
    </>
  );
}

export default MemberFinesPage;
