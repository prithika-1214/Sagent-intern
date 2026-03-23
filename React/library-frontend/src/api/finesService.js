import axiosClient from "./axiosClient";

export const getFines = async () => (await axiosClient.get("/fines")).data;

export const createFine = async (payload) => (await axiosClient.post("/fines", payload)).data;

export const updateFine = async (id, payload) => (await axiosClient.put(`/fines/${id}`, payload)).data;

export const deleteFine = async (id) => (await axiosClient.delete(`/fines/${id}`)).data;
