import axiosClient from "./axiosClient";

export const getBooks = async () => (await axiosClient.get("/books")).data;

export const createBook = async (payload) => (await axiosClient.post("/books", payload)).data;

export const updateBook = async (id, payload) => (await axiosClient.put(`/books/${id}`, payload)).data;

export const deleteBook = async (id) => (await axiosClient.delete(`/books/${id}`)).data;
