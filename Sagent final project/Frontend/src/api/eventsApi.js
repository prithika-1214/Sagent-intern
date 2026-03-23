import apiClient from './axios';

const BASE_PATH = '/api/events';

export const getEvents = () => apiClient.get(BASE_PATH).then((res) => res.data);
export const getEventById = (id) => apiClient.get(`${BASE_PATH}/${id}`).then((res) => res.data);
export const createEvent = (payload) => apiClient.post(BASE_PATH, payload).then((res) => res.data);
export const updateEvent = (id, payload) => apiClient.put(`${BASE_PATH}/${id}`, payload).then((res) => res.data);
export const deleteEvent = (id) => apiClient.delete(`${BASE_PATH}/${id}`).then((res) => res.data);
