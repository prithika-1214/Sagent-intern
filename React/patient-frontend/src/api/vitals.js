import api from "./axios";

const endpoint = "/vitals";

export async function getVitals() {
  const { data } = await api.get(endpoint);
  return data;
}

export async function getVitalById(id) {
  const { data } = await api.get(`${endpoint}/${id}`);
  return data;
}

export async function createVital(payload) {
  const { data } = await api.post(endpoint, payload);
  return data;
}

export async function updateVital(id, payload) {
  const { data } = await api.put(`${endpoint}/${id}`, payload);
  return data;
}

export async function deleteVital(id) {
  const { data } = await api.delete(`${endpoint}/${id}`);
  return data;
}