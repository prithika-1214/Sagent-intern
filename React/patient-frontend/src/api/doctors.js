import api from "./axios";

const endpoint = "/doctors";

export async function getDoctors() {
  const { data } = await api.get(endpoint);
  return data;
}

export async function getDoctorById(id) {
  const { data } = await api.get(`${endpoint}/${id}`);
  return data;
}

export async function createDoctor(payload) {
  const { data } = await api.post(endpoint, payload);
  return data;
}

export async function updateDoctor(id, payload) {
  const { data } = await api.put(`${endpoint}/${id}`, payload);
  return data;
}

export async function deleteDoctor(id) {
  const { data } = await api.delete(`${endpoint}/${id}`);
  return data;
}