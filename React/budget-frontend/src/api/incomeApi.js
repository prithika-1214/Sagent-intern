import axiosClient from './axiosClient';

export const getIncome = () => axiosClient.get('/income');
export const getIncomeById = (id) => axiosClient.get(`/income/${id}`);
export const createIncome = (payload) => axiosClient.post('/income', payload);
export const updateIncome = (id, payload) => axiosClient.put(`/income/${id}`, payload);
export const deleteIncome = (id) => axiosClient.delete(`/income/${id}`);