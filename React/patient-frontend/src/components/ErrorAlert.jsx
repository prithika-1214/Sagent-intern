export default function ErrorAlert({ message, onDismiss }) {
  if (!message) {
    return null;
  }

  return (
    <div className="alert alert-danger d-flex justify-content-between align-items-start" role="alert">
      <span>{message}</span>
      {onDismiss ? (
        <button type="button" className="btn-close" aria-label="Close" onClick={onDismiss} />
      ) : null}
    </div>
  );
}