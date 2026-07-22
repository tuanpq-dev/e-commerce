import axios from "axios";
import type { AxiosInstance } from "axios";
import type { NavigateFunction } from "react-router-dom";

const apiUrl = import.meta.env.VITE_API_URL;

let navigateFn: NavigateFunction | null = null;

export const setNavigate = (fn: NavigateFunction) => {
  navigateFn = fn;
};

interface CustomAxiosInstance
  extends Omit<AxiosInstance, "get" | "post" | "put" | "patch" | "delete"> {
  get<T = any>(url: string, config?: any): Promise<T>;
  post<T = any>(url: string, data?: any, config?: any): Promise<T>;
  put<T = any>(url: string, data?: any, config?: any): Promise<T>;
  patch<T = any>(url: string, data?: any, config?: any): Promise<T>;
  delete<T = any>(url: string, config?: any): Promise<T>;
}

const axiosClient = axios.create({
  baseURL: apiUrl,
  headers: {
    "Content-Type": "application/json",
  },
}) as CustomAxiosInstance;

axiosClient.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("accessToken") ||
      sessionStorage.getItem("accessToken");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosClient.interceptors.response.use(
  (response) => {
    if (response && response.data) {
      return response.data;
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 403) {
      if (navigateFn) {
        navigateFn("/403");
      } else {
        window.location.href = "/403";
      }
      return Promise.reject("Bạn không có quyền thực hiện chức năng này!");
    }
    const message = error.response?.data?.message || "Đã có lỗi hệ thống xảy ra!";
    return Promise.reject(message);
  }
);

export default axiosClient;