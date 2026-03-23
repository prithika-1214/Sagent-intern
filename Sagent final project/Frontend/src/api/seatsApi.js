import apiClient from './axios';
import { getValue } from '../utils/entity';

const BASE_PATH = '/api/seats';

const toSeatPayload = (payload = {}) => {
  const venueId = Number(getValue(payload, ['venueId', 'venue_id']));
  const seatPrice = Number(getValue(payload, ['seatPrice', 'seat_price']));
  const seatCount = Number(getValue(payload, ['seatCount', 'seat_count']));
  const concertCategoryName = getValue(payload, ['concertCategoryName', 'concert_category_name']);
  const normalizedSeatCount = Number.isFinite(seatCount)
    ? seatCount
    : concertCategoryName
      ? getValue(payload, ['seatCount', 'seat_count'])
      : 1;

  return {
    venueId: Number.isFinite(venueId) ? venueId : getValue(payload, ['venueId', 'venue_id']),
    seatNumber: getValue(payload, ['seatNumber', 'seat_number']),
    seatRow: getValue(payload, ['seatRow', 'seat_row']),
    audiId: getValue(payload, ['audiId', 'audi_id']),
    audiName: getValue(payload, ['audiName', 'audi_name']),
    seatType: getValue(payload, ['seatType', 'seat_type']),
    concertCategoryName,
    seatCount: normalizedSeatCount,
    seatPrice: Number.isFinite(seatPrice) ? seatPrice : getValue(payload, ['seatPrice', 'seat_price'])
  };
};

export const getSeats = () => apiClient.get(BASE_PATH).then((res) => res.data);
export const getSeatById = (id) => apiClient.get(`${BASE_PATH}/${id}`).then((res) => res.data);
export const getConcertInventoryByScheduleId = (scheduleId) =>
  apiClient.get(`${BASE_PATH}/concert-inventory/schedule/${scheduleId}`).then((res) => res.data);
export const createSeat = (payload) => apiClient.post(BASE_PATH, toSeatPayload(payload)).then((res) => res.data);
export const updateSeat = (id, payload) => apiClient.put(`${BASE_PATH}/${id}`, toSeatPayload(payload)).then((res) => res.data);
export const deleteSeat = (id) => apiClient.delete(`${BASE_PATH}/${id}`).then((res) => res.data);
