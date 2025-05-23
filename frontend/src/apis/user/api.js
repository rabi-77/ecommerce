import axios from "axios";
import { store } from "../../store/store";
import { refreshAccessTokenThunk } from "../../features/authSlice";
import { API_URL } from "../../config";

const api = axios.create({
  baseURL: `${API_URL}/user`,
});

// Request interceptor - adds token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("tokenAccess");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handles token refresh on 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If the error is 401 and we haven't tried to refresh the token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        console.log("Token expired, attempting to refresh...");
        // Use Redux store to dispatch the refresh token action
        const result = await store.dispatch(refreshAccessTokenThunk());
        
        // Check if the refresh was successful
        if (result.type.endsWith('/fulfilled')) {
          console.log("Token refresh successful, retrying original request");
          // Update the original request with the new token
          const newToken = localStorage.getItem("tokenAccess");
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        } else {
          // If refresh failed, throw an error to trigger the catch block
          throw new Error('Token refresh failed');
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        
        // Clear auth data and redirect to login
        localStorage.removeItem("tokenAccess");
        localStorage.removeItem("tokenRefresh");
        localStorage.removeItem("user");
        
        // Redirect to login page
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
