export default function LoadingSpinner({ message = "Loading..." }) {
  return (
    <div className="d-flex flex-column justify-content-center align-items-center py-5">
      <div className="spinner-border text-primary" role="status" aria-hidden="true" />
      <p className="mt-3 mb-0 text-secondary">{message}</p>
    </div>
  );
}