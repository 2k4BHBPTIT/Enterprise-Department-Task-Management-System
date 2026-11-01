import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ||
  'https://equity-matador-grub.ngrok-free.dev/api';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = ['Bearer', token].join(' ');
    }
    return config;
  },
  (error: unknown) => Promise.reject(error)
);

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse<unknown>>) => {
    const message =
      error.response?.data?.message ||
      (error.response?.status === 401 ? 'Phiên đăng nhập không hợp lệ hoặc tài khoản chưa được cấp quyền.' : undefined) ||
      (error.response?.status === 403 ? 'Tài khoản không có quyền thực hiện thao tác này.' : undefined) ||
      error.message;
    return Promise.reject(new Error(message));
  }
);

export const unwrapResponse = <T>(response: ApiResponse<T>): T => {
  if (!response.success) {
    throw new Error(response.message || 'Backend xử lý yêu cầu thất bại');
  }
  return response.data;
};
