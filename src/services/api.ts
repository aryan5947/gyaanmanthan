import axios, { AxiosError } from "axios";
import { loginModalStore } from "../store/loginModalStore"; 
// 👆 Zustand/Context store जो modal open/close control करेगा

const baseURL = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, ""); 
// 🔒 ensures no trailing slash

const API = axios.create({
  baseURL: `${baseURL}/api`,
  withCredentials: true,
});

// 🔑 Request Interceptor → inject token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token && config.headers) {
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

// 🚨 Response Interceptor → handle errors globally
let unauthorizedCount = 0;

API.interceptors.response.use(
  (res) => {
    // ✅ success → reset unauthorized counter
    unauthorizedCount = 0;
    return res;
  },
  (err: AxiosError) => {
    if (err.response?.status === 401) {
      unauthorizedCount++;

      // Token expired or invalid → cleanup
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // 🔥 Trigger modal only if 2+ consecutive 401s
      if (unauthorizedCount >= 2) {
        loginModalStore.getState().openModal();
      }
    }
    return Promise.reject(err);
  }
);

export default API;
