const EmptyState = ({ title = 'No data found', description = 'Try changing filters or add new records.' }) => (
  <div className="state-wrapper empty">
    <h3>{title}</h3>
    <p>{description}</p>
  </div>
);

export default EmptyState;
