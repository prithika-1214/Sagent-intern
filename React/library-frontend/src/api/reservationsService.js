import axiosClient from "./axiosClient";

export const getReservations = async () => (await axiosClient.get("/reservations")).data;

export const createReservation = async (payload) =>
  (await axiosClient.post("/reservations", payload)).data;

export const updateReservation = async (id, payload) =>
  (await axiosClient.put(`/reservations/${id}`, payload)).data;

export const deleteReservation = async (id) =>
  (await axiosClient.delete(`/reservations/${id}`)).data;
