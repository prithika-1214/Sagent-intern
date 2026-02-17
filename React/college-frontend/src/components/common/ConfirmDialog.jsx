import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";

const ConfirmDialog = ({ open, title, message, onConfirm, onCancel, loading }) => (
  <Dialog open={open} onClose={onCancel} fullWidth maxWidth="xs">
    <DialogTitle>{title}</DialogTitle>
    <DialogContent>
      <DialogContentText>{message}</DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button onClick={onCancel} disabled={loading}>
        Close
      </Button>
      <Button color="error" onClick={onConfirm} disabled={loading}>
        Confirm
      </Button>
    </DialogActions>
  </Dialog>
);

export default ConfirmDialog;
