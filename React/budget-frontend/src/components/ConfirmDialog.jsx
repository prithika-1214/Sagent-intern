import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';

const ConfirmDialog = ({ open, title, message, onConfirm, onClose, loading = false }) => (
  <Dialog open={open} onClose={loading ? undefined : onClose} fullWidth maxWidth="xs">
    <DialogTitle>{title}</DialogTitle>
    <DialogContent>
      <DialogContentText>{message}</DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} disabled={loading}>
        Cancel
      </Button>
      <Button color="error" variant="contained" onClick={onConfirm} disabled={loading}>
        Confirm
      </Button>
    </DialogActions>
  </Dialog>
);

export default ConfirmDialog;