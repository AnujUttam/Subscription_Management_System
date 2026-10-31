import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Attach authentication token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Handle API errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = "Something went wrong. Please try again.";

    if (error.response) {
      message =
        error.response.data?.error?.message ||
        error.response.data?.message ||
        error.response.data?.error ||
        message;

      // Clear token on 401 unauthorized (except during login attempt)
      if (error.response.status === 401 && !error.config?.url?.includes("/auth/login")) {
        localStorage.removeItem("authToken");
      }
    } else if (error.request) {
      message = "Unable to connect to server. Please check your connection.";
    }

    error.message = message;
    return Promise.reject(error);
  }
);

export default api;
