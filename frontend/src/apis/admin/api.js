import axios from "axios";
import {store} from "../../store/store";
import { refreshTokenThunk } from "../../features/admin/adminAuth/adminAuthSlice";
import { API_URL } from "../../config";

const api= axios.create({
    baseURL:`${API_URL}/admin`,
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

          const result = await store.dispatch(refreshTokenThunk());
          
          if (result.type.endsWith('/fulfilled')) {
            const newAccessToken = result.payload;
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return api(originalRequest);
          } else {
            throw new Error('Token refresh failed');
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          window.location.href="/adm/login"
          return Promise.reject(refreshError);
        }
      }
      return Promise.reject(error);
    }
  );

  export default api
