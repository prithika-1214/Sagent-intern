import apiClient from './axios';
import { getValue } from '../utils/entity';

const BASE_PATH = '/api/users';
const ALLOWED_ROLES = new Set(['ADMIN', 'USER']);

const toUserPayload = (payload = {}) => {
  const userName = getValue(payload, ['userName', 'user_name']);
  const email = getValue(payload, ['email']);
  const mobileNumber = getValue(payload, ['mobileNumber', 'mobile_number']);
  const password = getValue(payload, ['password']);
  const roleInput = String(getValue(payload, ['role'], 'USER')).toUpperCase();
  const role = ALLOWED_ROLES.has(roleInput) ? roleInput : 'USER';
  const accountStatus = String(getValue(payload, ['accountStatus', 'account_status'], 'ACTIVE')).toUpperCase();

  const normalized = {
    userName,
    email,
    mobileNumber: mobileNumber === '' ? '' : Number(mobileNumber) || mobileNumber,
    role,
    accountStatus
  };

  if (password !== undefined && password !== null && password !== '') {
    normalized.password = String(password);
  }

  return normalized;
};

export const getUsers = () => apiClient.get(BASE_PATH).then((res) => res.data);
export const getUserById = (id) => apiClient.get(`${BASE_PATH}/${id}`).then((res) => res.data);
export const createUser = (payload) => apiClient.post(BASE_PATH, toUserPayload(payload)).then((res) => res.data);
export const updateUser = (id, payload) => apiClient.put(`${BASE_PATH}/${id}`, toUserPayload(payload)).then((res) => res.data);
export const deleteUser = (id) => apiClient.delete(`${BASE_PATH}/${id}`).then((res) => res.data);
