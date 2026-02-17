import api from "./axios";

const endpoint = "/appointments";

export async function getAppointments() {
  const { data } = await api.get(endpoint);
  return data;
}

export async function getAppointmentById(id) {
  const { data } = await api.get(`${endpoint}/${id}`);
  return data;
}

export async function createAppointment(payload) {
  const { data } = await api.post(endpoint, payload);
  return data;
}

export async function updateAppointment(id, payload) {
  const { data } = await api.put(`${endpoint}/${id}`, payload);
  return data;
}

export async function deleteAppointment(id) {
  const { data } = await api.delete(`${endpoint}/${id}`);
  return data;
}