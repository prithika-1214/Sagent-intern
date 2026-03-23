import apiClient from './axios';
import { getValue } from '../utils/entity';

const BASE_PATH = '/api/event-seats';

const toEventSeatPayload = (payload = {}) => {
  const scheduleId = Number(getValue(payload, ['scheduleId', 'schedule_id']));
  const seatId = Number(getValue(payload, ['seatId', 'seat_id']));
  const seatPrice = Number(getValue(payload, ['seatPrice', 'seat_price']));

  return {
    scheduleId: Number.isFinite(scheduleId) ? scheduleId : getValue(payload, ['scheduleId', 'schedule_id']),
    seatId: Number.isFinite(seatId) ? seatId : getValue(payload, ['seatId', 'seat_id']),
    seatPrice: Number.isFinite(seatPrice) ? seatPrice : getValue(payload, ['seatPrice', 'seat_price']),
    seatStatus: getValue(payload, ['seatStatus', 'seat_status'])
  };
};

const toEventSeatHoldPayload = (payload = {}) => {
  const scheduleId = Number(getValue(payload, ['scheduleId', 'schedule_id']));
  const eventSeatIds = Array.isArray(getValue(payload, ['eventSeatIds', 'event_seat_ids']))
    ? getValue(payload, ['eventSeatIds', 'event_seat_ids'])
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value) && value > 0)
    : [];

  return {
    scheduleId: Number.isFinite(scheduleId) ? scheduleId : getValue(payload, ['scheduleId', 'schedule_id']),
    eventSeatIds,
    holdToken: String(getValue(payload, ['holdToken', 'hold_token'], '')).trim()
  };
};

export const getEventSeats = () => apiClient.get(BASE_PATH).then((res) => res.data);
export const getEventSeatById = (id) => apiClient.get(`${BASE_PATH}/${id}`).then((res) => res.data);
export const getEventSeatsByScheduleId = (scheduleId) =>
  apiClient.get(`${BASE_PATH}/schedule/${scheduleId}`).then((res) => res.data);
export const createEventSeat = (payload) => apiClient.post(BASE_PATH, toEventSeatPayload(payload)).then((res) => res.data);
export const updateEventSeat = (id, payload) =>
  apiClient.put(`${BASE_PATH}/${id}`, toEventSeatPayload(payload)).then((res) => res.data);
export const holdEventSeats = (payload) =>
  apiClient.post(`${BASE_PATH}/hold`, toEventSeatHoldPayload(payload)).then((res) => res.data);
export const releaseEventSeatHold = (holdToken) =>
  apiClient.delete(`${BASE_PATH}/hold/${encodeURIComponent(holdToken)}`).then((res) => res.data);
export const deleteEventSeat = (id) => apiClient.delete(`${BASE_PATH}/${id}`).then((res) => res.data);
