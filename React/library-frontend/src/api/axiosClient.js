import axios from "axios";

const BASE_URL = "http://localhost:8080";

const axiosClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const hasBasicAuthHeader = Boolean(error?.response?.headers?.["www-authenticate"]);
    const data = error?.response?.data;

    let message =
      data?.message ||
      data?.detail ||
      (typeof data === "string" ? data : null) ||
      error?.message;

    if (!error?.response) {
      message = `Cannot connect to backend at ${BASE_URL}. Start your Library Spring Boot server and try again.`;
    } else if (status === 401 && hasBasicAuthHeader) {
      message =
        "401 Unauthorized (Basic Auth). A different secured backend is running on this port. Start the Library backend on port 8080.";
    } else if (status === 409 && data?.path === "/members") {
      message = "Email already exists. Please use a different email.";
    } else if (status === 409 && data?.path === "/librarians") {
      message = "Email already exists. Please use a different email.";
    } else if (!message && data?.error) {
      message = data.error;
    } else if (!message) {
      message = `Request failed (${status})`;
    }

    return Promise.reject(new Error(String(message)));
  }
);

export default axiosClient;
