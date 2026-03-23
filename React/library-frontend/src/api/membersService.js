import axiosClient from "./axiosClient";

export const getMembers = async () => (await axiosClient.get("/members")).data;

export const createMember = async (payload) => (await axiosClient.post("/members", payload)).data;

export const updateMember = async (id, payload) => (await axiosClient.put(`/members/${id}`, payload)).data;

export const deleteMember = async (id) => (await axiosClient.delete(`/members/${id}`)).data;
