import axiosClient from './axiosClient';

export const getExpenses = () => axiosClient.get('/expenses');
export const getExpenseById = (id) => axiosClient.get(`/expenses/${id}`);
export const createExpense = (payload) => axiosClient.post('/expenses', payload);
export const updateExpense = (id, payload) => axiosClient.put(`/expenses/${id}`, payload);
export const deleteExpense = (id) => axiosClient.delete(`/expenses/${id}`);