
import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
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
        error.response.data?.message ||
        error.response.data?.error ||
        message;
    } else if (error.request) {
      message = "Unable to connect to server. Please check your connection.";
    }

    return Promise.reject({
      ...error,
      message,
    });
  }
);

export default api;
