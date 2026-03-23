import axios from 'axios';

const toText = (value) => String(value ?? '').trim();

const resolveApiBaseUrl = () => {
  const configuredBaseUrl = toText(import.meta.env.VITE_API_BASE_URL);
  if (configuredBaseUrl) {
    return configuredBaseUrl;
  }

  if (import.meta.env.DEV) {
    return '/';
  }

  if (typeof window !== 'undefined' && window.location?.hostname) {
    return `${window.location.protocol}//${window.location.hostname}:8080`;
  }

  return 'http://localhost:8080';
};

const apiClient = axios.create({
  baseURL: resolveApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 15000
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const responseData = error?.response?.data;
    const validationMessage =
      responseData && typeof responseData === 'object' && !Array.isArray(responseData)
        ? Object.values(responseData).find((value) => typeof value === 'string' && value.trim())
        : '';
    const message =
      responseData?.message ||
      responseData?.error ||
      validationMessage ||
      error?.message ||
      'Unexpected server error';
    return Promise.reject(new Error(message));
  }
);

export default apiClient;
