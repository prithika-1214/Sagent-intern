import { Dialog, DialogContent, DialogTitle } from "@mui/material";
import DynamicForm from "./DynamicForm";

function EntityDialogForm({
  open,
  title,
  fields,
  defaultValues,
  loading,
  submitLabel,
  onClose,
  onSubmit,
}) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DynamicForm
          fields={fields}
          defaultValues={defaultValues}
          loading={loading}
          submitLabel={submitLabel}
          onCancel={onClose}
          onSubmit={onSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}

export default EntityDialogForm;
