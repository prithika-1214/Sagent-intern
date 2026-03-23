import axiosClient from "./axiosClient";

export const getLibrarians = async () => (await axiosClient.get("/librarians")).data;

export const createLibrarian = async (payload) => (await axiosClient.post("/librarians", payload)).data;

export const updateLibrarian = async (id, payload) =>
  (await axiosClient.put(`/librarians/${id}`, payload)).data;

export const deleteLibrarian = async (id) => (await axiosClient.delete(`/librarians/${id}`)).data;
