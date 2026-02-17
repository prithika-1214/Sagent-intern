import { Alert, Button, Chip, Stack } from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { borrowsService, finesService, membersService } from "../../api/services";
import EntityTable from "../../components/common/EntityTable";
import LoadingState from "../../components/common/LoadingState";
import PageHeader from "../../components/common/PageHeader";
import EntityDialogForm from "../../components/forms/EntityDialogForm";
import { formatDate, todayInputValue } from "../../utils/dateUtils";
import {
  getBorrowId,
  getDisplayName,
  getFineId,
  getMemberId,
  getStatus,
  normalizeText,
  toIdString,
  withUpdatedStatus,
} from "../../utils/entityMappers";

function LibrarianFinesPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [fines, setFines] = useState([]);
  const [members, setMembers] = useState([]);
  const [borrows, setBorrows] = useState([]);
  const [editingFine, setEditingFine] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const [fineList, memberList, borrowList] = await Promise.all([
        finesService.list(),
        membersService.list(),
        borrowsService.list(),
      ]);
      setFines(fineList);
      setMembers(memberList);
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

  const membersMap = useMemo(
    () => new Map(members.map((member) => [toIdString(getMemberId(member)), member])),
    [members]
  );

  const fineFields = useMemo(
    () => [
      {
        name: "memberId",
        label: "Member",
        required: true,
        options: members.map((member) => ({
          value: getMemberId(member),
          label: `${getDisplayName(member)} (${toIdString(getMemberId(member))})`,
        })),
      },
      {
        name: "borrowId",
        label: "Borrow",
        required: true,
        options: borrows.map((borrow) => ({
          value: getBorrowId(borrow),
          label: `Borrow ${toIdString(getBorrowId(borrow))}`,
        })),
      },
      { name: "amount", label: "Amount", type: "number", required: true },
      {
        name: "status",
        label: "Status",
        options: [
          { label: "Unpaid", value: "UNPAID" },
          { label: "Paid", value: "PAID" },
          { label: "Waived", value: "WAIVED" },
        ],
      },
      { name: "issuedDate", label: "Issued Date", type: "date" },
      { name: "paidDate", label: "Paid Date", type: "date" },
    ],
    [members, borrows]
  );

  const closeDialog = () => {
    setEditingFine(null);
    setIsDialogOpen(false);
  };

  const openCreate = () => {
    setEditingFine(null);
    setIsDialogOpen(true);
  };

  const openEdit = (fine) => {
    setEditingFine(fine);
    setIsDialogOpen(true);
  };

  const handleSave = async (payload) => {
    setIsSaving(true);
    try {
      if (editingFine) {
        const id = getFineId(editingFine);
        if (!id) {
          throw new Error("Fine ID missing for update");
        }
        await finesService.update(id, payload);
        toast.success("Fine updated");
      } else {
        await finesService.create(payload);
        toast.success("Fine created");
      }
      closeDialog();
      await loadData();
    } catch (saveError) {
      toast.error(saveError.message || "Failed to save fine");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (fine) => {
    const id = getFineId(fine);
    if (!id) {
      toast.error("Fine ID missing");
      return;
    }

    try {
      await finesService.remove(id);
      toast.success("Fine deleted");
      await loadData();
    } catch (deleteError) {
      toast.error(deleteError.message || "Failed to delete fine");
    }
  };

  const markPaid = async (fine) => {
    const id = getFineId(fine);
    if (!id) {
      toast.error("Fine ID missing");
      return;
    }

    try {
      await finesService.update(
        id,
        withUpdatedStatus(
          {
            ...fine,
            paidDate: todayInputValue(),
          },
          "PAID"
        )
      );
      toast.success("Fine marked as paid");
      await loadData();
    } catch (payError) {
      toast.error(payError.message || "Failed to update fine");
    }
  };

  if (isLoading) {
    return <LoadingState label="Loading fines" />;
  }

  return (
    <>
      <PageHeader
        title="Manage Fines"
        subtitle="View/create/update fine records"
        actions={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={loadData}>
              Refresh
            </Button>
            <Button variant="contained" onClick={openCreate}>
              Add Fine
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
        rows={fines}
        getRowKey={(fine) => toIdString(getFineId(fine)) || toIdString(getBorrowId(fine))}
        columns={[
          {
            key: "id",
            label: "Fine ID",
            render: (fine) => toIdString(getFineId(fine)) || "-",
          },
          {
            key: "member",
            label: "Member",
            render: (fine) => {
              const member = membersMap.get(toIdString(getMemberId(fine)));
              return member ? getDisplayName(member) : `Member #${toIdString(getMemberId(fine)) || "?"}`;
            },
          },
          {
            key: "borrow",
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
        renderActions={(fine) => {
          const paid = normalizeText(getStatus(fine)).includes("paid");
          return (
            <Stack direction="row" spacing={1}>
              <Button size="small" variant="outlined" onClick={() => openEdit(fine)}>
                Edit
              </Button>
              <Button size="small" variant="outlined" color="success" disabled={paid} onClick={() => markPaid(fine)}>
                Mark Paid
              </Button>
              <Button size="small" variant="outlined" color="error" onClick={() => handleDelete(fine)}>
                Delete
              </Button>
            </Stack>
          );
        }}
        emptyTitle="No fines found"
        emptyDescription="Use Add Fine to create records manually if required."
      />

      <EntityDialogForm
        open={isDialogOpen}
        title={editingFine ? "Edit Fine" : "Add Fine"}
        fields={fineFields}
        defaultValues={editingFine || { status: "UNPAID", issuedDate: todayInputValue() }}
        submitLabel={editingFine ? "Update" : "Create"}
        loading={isSaving}
        onClose={closeDialog}
        onSubmit={handleSave}
      />
    </>
  );
}

export default LibrarianFinesPage;
