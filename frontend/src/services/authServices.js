import axios from "axios";
import { API_URL } from "../config";
import api from "../apis/user/api";

const URL =`${API_URL}/user/register`;

export const registerUser = async (userData) => {
  try {
    const response = await axios.post(`${URL}`, userData);
    return response.data;
  } catch (er) {
    throw new Error(
      er.response?.data?.message || "someting wrong with registration"
    );
  }
};

export const verifyUser = async ({ email, otp, token }) => {
  try {
    const response = await axios.post(`${URL}/verify-otp`, {
      email,
      otp,
      token,
    });
    return response.data;
  } catch (er) {
    throw new Error(
      er.response?.data?.message || "someting wrong with registration"
    );
  }
};

export const resendOtp = async ({ email, token }) => {
  try {
    const response = await axios.post(`${URL}/resend-otp`, { email, token });
    return response.data;
  } catch (er) {
    throw new Error(
      er.response?.data?.message || "someting wrong with registration"
    );
  }
};

export const loginUser = async (loginData) => {
  try {
    const response = await axios.post(`${API_URL}/user/login`, loginData);
    return response.data;
  } catch (er) {
    throw new Error(er.response?.data?.message || "Login failed");
  }
};

// Forgot password services
export const requestPasswordReset = async (email) => {
  try {
    const response = await axios.post(`${API_URL}/user/forgot-password`, {
      email,
    });
    return response.data;
  } catch (er) {
    throw new Error(
      er.response?.data?.message || "Failed to request password reset"
    );
  }
};

export const resendPasswordResetOtp = async (email) => {
  try {
    const response = await axios.post(
      `${API_URL}/user/resend-password-reset-otp`,
      { email }
    );
    return response.data;
  } catch (er) {
    throw new Error(er.response?.data?.message || "Failed to resend OTP");
  }
};

export const resetPassword = async (resetData) => {
  try {
    const response = await axios.post(
      `${API_URL}/user/reset-password`,
      resetData
    );
    return response.data;
  } catch (er) {
    throw new Error(er.response?.data?.message || "Failed to reset password");
  }
};

export const checkUserStatus = async () => {
  try {
    const token = localStorage.getItem('tokenAccess');
    if (!token) {
      console.warn('No access token found when checking user status');
      throw new Error('No access token available');
    }

    const response = await api.get(`/check-status`);
    return response.data;
  } catch (er) {
    console.error('Error checking user status:', er);
    
    if (er.response?.status === 403 && er.response?.data?.isBlocked) {
      console.warn('User is blocked, clearing auth data');
      localStorage.removeItem("user");
      localStorage.removeItem("tokenAccess");
      localStorage.removeItem("tokenRefresh");
      return { isBlocked: true, message: er.response.data.message };
    }
    
    throw new Error(
      er.response?.data?.message || "Failed to check user status"
    );
  }
};

export const logoutUser = async () => {
  try {
    const response = await api.post(`/logout`);
    return response.data;
  } catch (er) {
    throw new Error(er.response?.data?.message || "Failed to logout");
  }
};

export const refreshAccessToken = async () => {
  try {
    const token = localStorage.getItem("tokenRefresh");
    if (!token) {
      throw new Error("No refresh token found");
    }
    
    const response = await axios.post(`${API_URL}/user/refresh`, {
      refreshToken: token,
    });

    if (!response.data || !response.data.tokenAccess) {
      console.error('Invalid response format from refresh token endpoint:', response.data);
      throw new Error("Invalid token response format from server");
    }

    localStorage.setItem("tokenAccess", response.data.tokenAccess);
    
    if (response.data.tokenRefresh) {
      localStorage.setItem("tokenRefresh", response.data.tokenRefresh);
    }
    
    return response.data;
  } catch (err) {
    console.error('Error refreshing token:', err);
    throw new Error(
      err.response?.data?.message || "Failed to refresh access token"
    );
  }
};
