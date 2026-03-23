import axiosClient from './axiosClient';

export const getUsers = () => axiosClient.get('/users');
export const getUserById = (id) => axiosClient.get(`/users/${id}`);
export const createUser = (payload) => axiosClient.post('/users', payload);
export const updateUser = (id, payload) => axiosClient.put(`/users/${id}`, payload);
export const deleteUser = (id) => axiosClient.delete(`/users/${id}`);