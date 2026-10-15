import axios from "axios";

const rawBaseUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
const baseURL = rawBaseUrl
  ? (rawBaseUrl.endsWith("/api") ? rawBaseUrl : `${rawBaseUrl.replace(/\/$/, "")}/api`)
  : "/api";

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: attach bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("bikehub_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 unauthorized gracefully
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear credentials if token expired
      const isAuthEndpoint = error.config?.url?.includes("/auth/");
      if (!isAuthEndpoint) {
        localStorage.removeItem("bikehub_token");
        localStorage.removeItem("bikehub_user");
      }
    }
    return Promise.reject(error);
  }
);

export default api;
