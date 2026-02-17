import api from "./axios";

const endpoint = "/feedback";

export async function getFeedbackList() {
  const { data } = await api.get(endpoint);
  return data;
}

export async function getFeedbackById(id) {
  const { data } = await api.get(`${endpoint}/${id}`);
  return data;
}

export async function createFeedback(payload) {
  const { data } = await api.post(endpoint, payload);
  return data;
}

export async function updateFeedback(id, payload) {
  const { data } = await api.put(`${endpoint}/${id}`, payload);
  return data;
}

export async function deleteFeedback(id) {
  const { data } = await api.delete(`${endpoint}/${id}`);
  return data;
}