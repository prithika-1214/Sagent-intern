import axios from "axios";
import appConfig from "../config/appConfig";

function parseApiError(error) {
  const responseData = error?.response?.data;
  const status = Number(error?.response?.status);

  if (typeof responseData === "string" && responseData.trim()) {
    return responseData;
  }

  if (responseData && typeof responseData === "object") {
    const candidate = responseData.message || responseData.error || responseData.details;
    if (candidate) {
      return String(candidate);
    }

    try {
      return JSON.stringify(responseData);
    } catch {
      // Continue with fallback mapping.
    }
  }

  if (status === 409) {
    return "Record already exists. Try signing in or use different details.";
  }

  if (status >= 500) {
    return "Server error while processing request. Verify backend logs and VITE_PROXY_TARGET (backend port).";
  }

  if (error?.code === "ERR_NETWORK") {
    return "Cannot reach Library API. Ensure Spring Boot is running and API URL/proxy is configured.";
  }

  if (error?.code === "ECONNABORTED") {
    return "API request timed out. Check backend health and network.";
  }

  return error?.message || "Request failed";
}

const axiosClient = axios.create({
  baseURL: appConfig.apiBaseUrl,
  timeout: 15000,
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const wrapped = new Error(parseApiError(error));
    wrapped.status = error?.response?.status;
    wrapped.data = error?.response?.data;
    wrapped.original = error;
    return Promise.reject(wrapped);
  }
);

export default axiosClient;
