import axios from "axios";
import { API_URL } from "../../config";

export const getUserProfile = async (id) => {
  try {
    const token = localStorage.getItem("tokenAccess");
    if (!token) {
      throw new Error("No token found");
    }
    
    const response = await axios.get(`${API_URL}/user/profile`, {
      params:{id},
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    return response.data;
  } catch (err) {
    
    throw new Error(
      err.response?.data?.message || "Failed to fetch profile"
    );
  }
};

export const updateUserProfile = async (profileData) => {
  try {
    const token = localStorage.getItem("tokenAccess");
    if (!token) {
      throw new Error("No token found");
    }
    
    const response = await axios.put(`${API_URL}/user/profile`, profileData, {
      headers: {
        Authorization: `Bearer ${token}`,
        // Don't set Content-Type here as it will be automatically set with the correct boundary for FormData
      },
    });
    
    return response.data;
  } catch (err) {
    throw new Error(
      err.response?.data?.message || "Failed to update profile"
    );
  }
};
