import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token && !config.headers.Authorization) {
    config.headers.Authorization =
      token.startsWith('Bearer ') || token.startsWith('Basic ')
        ? token
        : `Bearer ${token}`;
  }

  return config;
});

export default api;
