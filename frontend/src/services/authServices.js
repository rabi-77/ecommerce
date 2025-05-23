import axios from "axios";
import { API_URL } from "../config";
import api from "../apis/user/api";

const URL = `${API_URL}/user/register`;

export const registerUser = async (userData) => {
  try {
    console.log(userData);

    const response = await axios.post(`${URL}`, userData);
    console.log("success");

    return response.data;
  } catch (er) {
    console.log(API_URL);
    console.log("hi", er.message);
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
    console.log("hi");
    console.log(response.data);

    return response.data;
  } catch (er) {
    console.log("errrrr", er.message);

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
    // If validateOnly is true, we're just checking if the OTP is valid
    // without actually resetting the password
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
    // Check if token exists before making the request
    const token = localStorage.getItem('tokenAccess');
    if (!token) {
      console.warn('No access token found when checking user status');
      throw new Error('No access token available');
    }

    // Use the API instance with interceptors for automatic token refresh
    console.log('Making request to check user status');
    const response = await api.get(`/check-status`);
    console.log('User status check successful:', response.data);
    return response.data;
  } catch (er) {
    console.error('Error checking user status:', er);
    
    // Handle specific error cases
    if (er.response?.status === 403 && er.response?.data?.isBlocked) {
      // If user is blocked, immediately clear localStorage
      console.warn('User is blocked, clearing auth data');
      localStorage.removeItem("user");
      localStorage.removeItem("tokenAccess");
      localStorage.removeItem("tokenRefresh");
      return { isBlocked: true, message: er.response.data.message };
    }
    
    // For token expiration, the API interceptor will handle the refresh
    // We just need to throw the error to be handled by the component
    throw new Error(
      er.response?.data?.message || "Failed to check user status"
    );
  }
};

export const logoutUser = async () => {
  try {
    console.log("logout");
    // Use the API instance with interceptors
    const response = await api.post(`/logout`);
    console.log("hoi", response.data);
    return response.data;
  } catch (er) {
    console.log("logout error", er.message);
    console.log("hi", er.response?.data?.message);
    throw new Error(er.response?.data?.message || "Failed to logout");
  }
};

export const refreshAccessToken = async () => {
  try {
    const token = localStorage.getItem("tokenRefresh");
    if (!token) {
      throw new Error("No refresh token found");
    }
    
    // Use direct axios call here to avoid circular dependency with the interceptor
    const response = await axios.post(`${API_URL}/user/refresh`, {
      refreshToken: token,
    });

    // Ensure we have a valid response with tokenAccess
    if (!response.data || !response.data.tokenAccess) {
      console.error('Invalid response format from refresh token endpoint:', response.data);
      throw new Error("Invalid token response format from server");
    }

    // Store the new access token
    localStorage.setItem("tokenAccess", response.data.tokenAccess);
    
    // If a new refresh token is provided, update it as well
    if (response.data.tokenRefresh) {
      localStorage.setItem("tokenRefresh", response.data.tokenRefresh);
    }
    
    console.log('Token refreshed successfully');
    return response.data;
  } catch (err) {
    console.error('Error refreshing token:', err);
    throw new Error(
      err.response?.data?.message || "Failed to refresh access token"
    );
  }
};
