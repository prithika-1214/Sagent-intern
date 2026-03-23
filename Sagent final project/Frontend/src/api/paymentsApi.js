import apiClient from './axios';
import { getValue } from '../utils/entity';

const BASE_PATH = '/api/payments';

const hasValue = (value) => value !== undefined && value !== null && value !== '';

const toNumberOrUndefined = (value) => {
  if (!hasValue(value)) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const toPaymentPayload = (payload = {}) => ({
  bookingId: toNumberOrUndefined(getValue(payload, ['bookingId', 'booking_id'])),
  paymentMethod: getValue(payload, ['paymentMethod', 'payment_method']),
  amount: toNumberOrUndefined(getValue(payload, ['amount'])),
  discountAmount: toNumberOrUndefined(getValue(payload, ['discountAmount', 'discount_amount'], 0)),
  convenienceFee: toNumberOrUndefined(getValue(payload, ['convenienceFee', 'convenience_fee'], 0)),
  gstPercentage: toNumberOrUndefined(getValue(payload, ['gstPercentage', 'gst_percentage'], 18)),
  gstAmount: toNumberOrUndefined(getValue(payload, ['gstAmount', 'gst_amount'], 0)),
  paymentStatus: getValue(payload, ['paymentStatus', 'payment_status']),
  transactionId: getValue(payload, ['transactionId', 'transaction_id'])
});

export const getPayments = () => apiClient.get(BASE_PATH).then((res) => res.data);
export const getPaymentById = (id) => apiClient.get(`${BASE_PATH}/${id}`).then((res) => res.data);
export const createPayment = (payload) => apiClient.post(BASE_PATH, toPaymentPayload(payload)).then((res) => res.data);
export const updatePayment = (id, payload) => apiClient.put(`${BASE_PATH}/${id}`, toPaymentPayload(payload)).then((res) => res.data);
export const deletePayment = (id) => apiClient.delete(`${BASE_PATH}/${id}`).then((res) => res.data);
