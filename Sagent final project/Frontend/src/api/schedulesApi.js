import apiClient from './axios';
import { getValue } from '../utils/entity';

const BASE_PATH = '/api/event-schedules';
const hasValue = (value) => value !== undefined && value !== null && value !== '';
const toNumberOrOriginal = (value) => {
  if (!hasValue(value)) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : value;
};

const toSchedulePayload = (payload = {}) => {
  const availableSeatsValue = Number(getValue(payload, ['availableSeats', 'available_seats']));
  const hasAvailableSeats = Number.isFinite(availableSeatsValue);
  const schedulePayload = {};
  const eventIdValue = toNumberOrOriginal(getValue(payload, ['eventId', 'event_id']));
  const venueIdValue = toNumberOrOriginal(getValue(payload, ['venueId', 'venue_id']));
  const audiIdValue = getValue(payload, ['audiId', 'audi_id']);
  const audiNameValue = getValue(payload, ['audiName', 'audi_name']);
  const showDateValue = getValue(payload, ['showDate', 'show_date']);
  const showTimeValue = getValue(payload, ['showTime', 'show_time']);
  const scheduleStatusValue = getValue(payload, ['scheduleStatus', 'schedule_status']);

  if (hasValue(eventIdValue)) {
    schedulePayload.eventId = eventIdValue;
  }

  if (hasValue(venueIdValue)) {
    schedulePayload.venueId = venueIdValue;
  }

  if (hasValue(audiIdValue)) {
    schedulePayload.audiId = audiIdValue;
  }

  if (hasValue(audiNameValue)) {
    schedulePayload.audiName = audiNameValue;
  }

  if (hasValue(showDateValue)) {
    schedulePayload.showDate = showDateValue;
  }

  if (hasValue(showTimeValue)) {
    schedulePayload.showTime = showTimeValue;
  }

  if (hasValue(scheduleStatusValue)) {
    schedulePayload.scheduleStatus = scheduleStatusValue;
  }

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
