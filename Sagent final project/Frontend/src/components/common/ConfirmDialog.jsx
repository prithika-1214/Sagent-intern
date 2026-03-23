import Modal from './Modal';

const ConfirmDialog = ({
  isOpen,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  intent = 'danger',
  loading = false
}) => (
  <Modal
    isOpen={isOpen}
    title={title}
    onClose={onCancel}
    footer={
      <>
        <button type="button" className="btn btn-outline" onClick={onCancel} disabled={loading}>
          {cancelText}
        </button>
        <button type="button" className={`btn btn-${intent}`} onClick={onConfirm} disabled={loading}>
          {loading ? 'Please wait...' : confirmText}
        </button>
      </>
    }
  >
    <p>{message}</p>
  </Modal>
);

export default ConfirmDialog;
