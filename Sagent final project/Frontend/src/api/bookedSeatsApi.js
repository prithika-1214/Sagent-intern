import apiClient from './axios';

const BASE_PATH = '/api/booked-seats';

export const getBookedSeats = () => apiClient.get(BASE_PATH).then((res) => res.data);
export const getBookedSeatById = (id) => apiClient.get(`${BASE_PATH}/${id}`).then((res) => res.data);
export const getBookedSeatsByBookingId = (bookingId) =>
  apiClient.get(`${BASE_PATH}/booking/${bookingId}`).then((res) => res.data);
export const createBookedSeat = (payload) => apiClient.post(BASE_PATH, payload).then((res) => res.data);
export const updateBookedSeat = (id, payload) => apiClient.put(`${BASE_PATH}/${id}`, payload).then((res) => res.data);
export const deleteBookedSeat = (id) => apiClient.delete(`${BASE_PATH}/${id}`).then((res) => res.data);
