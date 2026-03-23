const ErrorState = ({ message = 'Something went wrong.', onRetry }) => (
  <div className="state-wrapper error">
    <h3>Unable to load data</h3>
    <p>{message}</p>
    {onRetry ? (
      <button type="button" className="btn btn-primary" onClick={onRetry}>
        Retry
      </button>
    ) : null}
  </div>
);

export default ErrorState;
