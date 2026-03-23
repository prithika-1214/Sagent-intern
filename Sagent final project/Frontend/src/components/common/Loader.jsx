const Loader = ({ text = 'Loading...' }) => (
  <div className="state-wrapper" role="status" aria-live="polite">
    <div className="spinner" />
    <p>{text}</p>
  </div>
);

export default Loader;
