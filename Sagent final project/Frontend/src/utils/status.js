export const getStatusClassName = (status) => {
  const value = (status || '').toString().toUpperCase();

  if (['ACTIVE', 'OPEN', 'CONFIRMED', 'SUCCESS', 'AVAILABLE', 'COMPLETED', 'ENJOYED'].includes(value)) {
    return 'status-badge success';
  }

  if (['CANCELLED', 'BOOKED', 'FAILED', 'REFUNDED', 'INACTIVE', 'CLOSED'].includes(value)) {
    return 'status-badge danger';
  }

  if (['PENDING', 'PROCESSING', 'HELD'].includes(value)) {
    return 'status-badge warning';
  }

  return 'status-badge neutral';
};
