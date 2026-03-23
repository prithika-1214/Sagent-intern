import axiosClient from "./axiosClient";

export const getBookCopies = async () => (await axiosClient.get("/book-copies")).data;

export const createBookCopy = async (payload) => (await axiosClient.post("/book-copies", payload)).data;

export const updateBookCopy = async (id, payload) =>
  (await axiosClient.put(`/book-copies/${id}`, payload)).data;

export const deleteBookCopy = async (id) => (await axiosClient.delete(`/book-copies/${id}`)).data;
