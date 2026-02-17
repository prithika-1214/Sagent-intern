import axios from 'axios';

const configuredBaseUrl = String(import.meta.env.VITE_API_BASE_URL || '/api').trim();
const baseURL = configuredBaseUrl.replace(/\/+$/, '');

const axiosClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export default axiosClient;
