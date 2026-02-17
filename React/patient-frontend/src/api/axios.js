import axios from "axios";

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const useDevProxy = import.meta.env.DEV;

const api = axios.create({
  baseURL: useDevProxy ? "/api" : configuredBaseUrl,
  headers: {
    "Content-Type": "application/json"
  }
});

export default api;
