import apiClient from './axios';

const normalizeMobileNumber = (value) => {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (!digits) {
    return '';
  }
  return Number(digits) || digits;
};

export const loginUser = (payload = {}) =>
  apiClient
    .post('/api/auth/login', {
      email: String(payload.email ?? '').trim(),
      password: String(payload.password ?? '')
    })
    .then((res) => res.data);

export const sendPasswordResetOtp = (payload = {}) =>
  apiClient
    .post('/api/auth/forgot-password/send-otp', {
      mobileNumber: normalizeMobileNumber(payload.mobileNumber)
    })
    .then((res) => res.data);

export const verifyPasswordResetOtp = (payload = {}) =>
  apiClient
    .post('/api/auth/forgot-password/verify-otp', {
      mobileNumber: normalizeMobileNumber(payload.mobileNumber),
      otp: String(payload.otp ?? '').trim()
    })
    .then((res) => res.data);

export const resetPasswordWithOtp = (payload = {}) =>
  apiClient
    .post('/api/auth/forgot-password/reset', {
      mobileNumber: normalizeMobileNumber(payload.mobileNumber),
      otp: String(payload.otp ?? '').trim(),
      newPassword: String(payload.newPassword ?? ''),
      confirmPassword: String(payload.confirmPassword ?? '')
    })
    .then((res) => res.data);
