import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  withCredentials: true, // For HttpOnly cookies (access token & refresh token)
});

// Request interceptor: Currently tokens are managed via HttpOnly cookies, so we might not need to attach Bearer tokens.
// If access_token was in localStorage, we'd attach it here.
api.interceptors.request.use(
  (config) => {
    // If needed: const token = useAuthStore.getState().token;
    // if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle 401 Unauthorized for Refresh Token logic
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Attempt to refresh token
        await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );
        // If successful, retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh token failed, clear auth state
        // useAuthStore.getState().logout();
        // window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
