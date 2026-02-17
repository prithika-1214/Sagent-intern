import axiosClient from './axiosClient';

export const getBalance = () => axiosClient.get('/balance');
export const getBalanceById = (id) => axiosClient.get(`/balance/${id}`);
export const createBalance = (payload) => axiosClient.post('/balance', payload);
export const updateBalance = (id, payload) => axiosClient.put(`/balance/${id}`, payload);
export const deleteBalance = (id) => axiosClient.delete(`/balance/${id}`);