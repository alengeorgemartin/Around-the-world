import axios from "axios";
import { getToken, logout } from "./auth";

const api = axios.create({
  baseURL: "http://127.0.0.1:5000/api",
  withCredentials: true,
});

// REQUEST → attach access token
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// RESPONSE → refresh token flow
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const res = await axios.post(
          "http://127.0.0.1:5000/api/auth/refresh",
          {},
          { withCredentials: true }
        );

        localStorage.setItem("token", res.data.token);
        originalRequest.headers.Authorization =
          `Bearer ${res.data.token}`;

        return api(originalRequest);
      } catch {
        logout();
      }
    }

    return Promise.reject(error);
  }
);

export default api;
