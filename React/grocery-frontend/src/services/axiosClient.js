import axios from "axios";
import { toast } from "react-hot-toast";
import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from "../utils/constants";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  ...(apiBaseUrl ? { baseURL: apiBaseUrl } : {}),
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_USER_KEY);
      if (window.location.pathname !== "/auth/login") {
        window.location.assign("/auth/login");
      }
    }

    const isNetworkError = error?.code === "ERR_NETWORK";
    if (!error?.config?.skipGlobalError && !isNetworkError) {
      const message = error?.response?.data?.message || error?.message || "Request failed";
      toast.error(message);
    }

    return Promise.reject(error);
  },
);

export default api;
