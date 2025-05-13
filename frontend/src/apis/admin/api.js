import axios from "axios";

const api= axios.create({
    baseURL:"http://localhost:5000/admin",
    headers:{
        "Content-Type":"application/json"
    }
})

api.interceptors.request.use(
    (config)=>{
        const token = localStorage.getItem("accesstoken");
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
          const response = await axios.post("http://localhost:5000/admin/refresh", {
            refreshToken: localStorage.getItem("refreshToken"),
          });
          const { accessToken } = response.data;
          localStorage.setItem("accessToken", accessToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
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
