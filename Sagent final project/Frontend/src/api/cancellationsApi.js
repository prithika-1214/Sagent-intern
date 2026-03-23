import apiClient from './axios';
import { getValue } from '../utils/entity';

const BASE_PATH = '/api/cancellations';

const hasValue = (value) => value !== undefined && value !== null && value !== '';

const toNumberOrUndefined = (value) => {
  if (!hasValue(value)) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const toCancellationCreatePayload = (payload = {}) => ({
  bookingId: toNumberOrUndefined(getValue(payload, ['bookingId', 'booking_id'])),
  userId: toNumberOrUndefined(getValue(payload, ['userId', 'user_id'])),
  cancellationReason: getValue(payload, ['cancellationReason', 'cancellation_reason']),
  cancellationType: getValue(payload, ['cancellationType', 'cancellation_type']),
  refundAmount: toNumberOrUndefined(getValue(payload, ['refundAmount', 'refund_amount'], 0)),
  refundStatus: getValue(payload, ['refundStatus', 'refund_status'])
});

const toCancellationUpdatePayload = (payload = {}) => ({
  refundStatus: getValue(payload, ['refundStatus', 'refund_status'])
});

export const getCancellations = () => apiClient.get(BASE_PATH).then((res) => res.data);
export const getCancellationById = (id) => apiClient.get(`${BASE_PATH}/${id}`).then((res) => res.data);
export const createCancellation = (payload) =>
  apiClient.post(BASE_PATH, toCancellationCreatePayload(payload)).then((res) => res.data);
export const updateCancellation = (id, payload) =>
  apiClient.put(`${BASE_PATH}/${id}`, toCancellationUpdatePayload(payload)).then((res) => res.data);
export const deleteCancellation = (id) => apiClient.delete(`${BASE_PATH}/${id}`).then((res) => res.data);
