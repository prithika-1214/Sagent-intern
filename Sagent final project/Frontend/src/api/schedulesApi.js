import apiClient from './axios';
import { getValue } from '../utils/entity';

const BASE_PATH = '/api/event-schedules';

const toSchedulePayload = (payload = {}) => {
  const eventIdValue = Number(getValue(payload, ['eventId', 'event_id']));
  const venueIdValue = Number(getValue(payload, ['venueId', 'venue_id']));
  const availableSeatsValue = Number(getValue(payload, ['availableSeats', 'available_seats']));
  const hasAvailableSeats = Number.isFinite(availableSeatsValue);

  const schedulePayload = {
    eventId: Number.isFinite(eventIdValue) ? eventIdValue : getValue(payload, ['eventId', 'event_id']),
    venueId: Number.isFinite(venueIdValue) ? venueIdValue : getValue(payload, ['venueId', 'venue_id']),
    audiId: getValue(payload, ['audiId', 'audi_id']),
    audiName: getValue(payload, ['audiName', 'audi_name']),
    showDate: getValue(payload, ['showDate', 'show_date']),
    showTime: getValue(payload, ['showTime', 'show_time']),
    scheduleStatus: getValue(payload, ['scheduleStatus', 'schedule_status'])
  };

  if (hasAvailableSeats) {
    schedulePayload.availableSeats = availableSeatsValue;
  }

  return schedulePayload;
};

export const getSchedules = () => apiClient.get(BASE_PATH).then((res) => res.data);
export const getScheduleById = (id) => apiClient.get(`${BASE_PATH}/${id}`).then((res) => res.data);
export const getSchedulesByEventId = (eventId) =>
  apiClient.get(`${BASE_PATH}/event/${eventId}`).then((res) => res.data);
export const createSchedule = (payload) => apiClient.post(BASE_PATH, toSchedulePayload(payload)).then((res) => res.data);
export const updateSchedule = (id, payload) =>
  apiClient.put(`${BASE_PATH}/${id}`, toSchedulePayload(payload)).then((res) => res.data);
export const deleteSchedule = (id) => apiClient.delete(`${BASE_PATH}/${id}`).then((res) => res.data);
