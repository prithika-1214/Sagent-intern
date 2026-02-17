import axios from "axios";
import { AUTH_EVENTS } from "../constants/appConstants";
import { clearSession, getAuthHeader } from "../utils/authStorage";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const authHeader = getAuthHeader();
    const url = String(config.url || "");
    const isAuthRoute = url.startsWith("/auth/");

    if (authHeader && !isAuthRoute && !config.headers.Authorization) {
      config.headers.Authorization = authHeader;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const hadAuthHeader = Boolean(error?.config?.headers?.Authorization);

    if ((status === 401 || status === 403) && hadAuthHeader) {
      clearSession();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(AUTH_EVENTS.FORCE_LOGOUT));
      }
    }
    return Promise.reject(error);
  },
);

export default api;
