import axios from "axios";
import {store} from "../../store/store";
import { refreshTokenThunk } from "../../features/admin/adminAuth/adminAuthSlice";

const api= axios.create({
    baseURL:"http://localhost:5050/admin",
})

api.interceptors.request.use(
    (config)=>{
        const token = localStorage.getItem("accessToken");
        if(token){
            config.headers.Authorization=`Bearer ${token}`
        }
        return config
    },
    (error)=>Promise.reject(error)
)

api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
          // Use Redux store to dispatch the refresh token action
          const result = await store.dispatch(refreshTokenThunk());
          
          // Check if the refresh was successful
          if (result.type.endsWith('/fulfilled')) {
            const newAccessToken = result.payload;
            // Update the original request with the new token
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return api(originalRequest);
          } else {
            // If refresh failed, throw an error to trigger the catch block
            throw new Error('Token refresh failed');
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          window.location.href="/admin/login"
          return Promise.reject(refreshError);
        }
      }
      return Promise.reject(error);
    }
  );

  export default api
