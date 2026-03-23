import axiosClient from './axiosClient';

export const getCategories = () => axiosClient.get('/categories');
export const getCategoryById = (id) => axiosClient.get(`/categories/${id}`);
export const createCategory = (payload) => axiosClient.post('/categories', payload);
export const updateCategory = (id, payload) => axiosClient.put(`/categories/${id}`, payload);
export const deleteCategory = (id) => axiosClient.delete(`/categories/${id}`);