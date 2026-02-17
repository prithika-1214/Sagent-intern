import api from "./axios";

const endpoint = "/medical-history";

export async function getMedicalHistories() {
  const { data } = await api.get(endpoint);
  return data;
}

export async function getMedicalHistoryById(id) {
  const { data } = await api.get(`${endpoint}/${id}`);
  return data;
}

export async function createMedicalHistory(payload) {
  const { data } = await api.post(endpoint, payload);
  return data;
}

export async function updateMedicalHistory(id, payload) {
  const { data } = await api.put(`${endpoint}/${id}`, payload);
  return data;
}

export async function deleteMedicalHistory(id) {
  const { data } = await api.delete(`${endpoint}/${id}`);
  return data;
}