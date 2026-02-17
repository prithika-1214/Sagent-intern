import axiosClient from './axiosClient';

export const getSavings = () => axiosClient.get('/savings');
export const getSavingsById = (id) => axiosClient.get(`/savings/${id}`);
export const createSavings = (payload) => axiosClient.post('/savings', payload);
export const updateSavings = (id, payload) => axiosClient.put(`/savings/${id}`, payload);
export const deleteSavings = (id) => axiosClient.delete(`/savings/${id}`);