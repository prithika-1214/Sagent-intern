import axiosClient from "./axiosClient";

export const getBorrows = async () => (await axiosClient.get("/borrows")).data;

export const createBorrow = async (payload) => (await axiosClient.post("/borrows", payload)).data;

export const updateBorrow = async (id, payload) => (await axiosClient.put(`/borrows/${id}`, payload)).data;

export const deleteBorrow = async (id) => (await axiosClient.delete(`/borrows/${id}`)).data;
