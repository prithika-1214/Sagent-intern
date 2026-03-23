import apiClient from './axios';
import { getValue } from '../utils/entity';

const BASE_PATH = '/api/bookings';

const toBookingStatusPayload = (payload = {}) => {
  const rawStatus =
    typeof payload === 'string'
      ? payload
      : getValue(payload, ['bookingStatus', 'booking_status', 'status']);
  const bookingStatus = String(rawStatus || '').trim().toUpperCase();

  if (!bookingStatus) {
    throw new Error('Booking status is required');
  }

  return { bookingStatus };
};

export const getBookings = () => apiClient.get(BASE_PATH).then((res) => res.data);
export const getBookingById = (id) => apiClient.get(`${BASE_PATH}/${id}`).then((res) => res.data);
export const createBooking = (payload) => apiClient.post(BASE_PATH, payload).then((res) => res.data);
export const updateBooking = (id, payload) =>
  apiClient.put(`${BASE_PATH}/${id}`, toBookingStatusPayload(payload)).then((res) => res.data);
export const deleteBooking = (id) => apiClient.delete(`${BASE_PATH}/${id}`).then((res) => res.data);
