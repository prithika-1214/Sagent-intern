import api from "./axios";

const endpoint = "/patients";

export async function getPatients() {
  const { data } = await api.get(endpoint);
  return data;
}

export async function getPatientById(id) {
  const { data } = await api.get(`${endpoint}/${id}`);
  return data;
}

export async function createPatient(payload) {
  const { data } = await api.post(endpoint, payload);
  return data;
}

export async function updatePatient(id, payload) {
  const { data } = await api.put(`${endpoint}/${id}`, payload);
  return data;
}

export async function deletePatient(id) {
  const { data } = await api.delete(`${endpoint}/${id}`);
  return data;
}