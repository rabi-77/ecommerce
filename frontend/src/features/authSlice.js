import {
  createSlice,
  createAsyncThunk,
  buildCreateSlice,
} from "@reduxjs/toolkit";
import { registerUser, verifyUser, resendOtp, loginUser, requestPasswordReset, resendPasswordResetOtp, resetPassword ,logoutUser,refreshAccessToken} from "../services/authServices";
// import { build } from "vite";

export const login = createAsyncThunk(
  "auth/login",
  async (loginData, { rejectWithValue }) => {
    try {
      const data = await loginUser(loginData);
      return data;
    } catch (err) {
      return rejectWithValue(err.message || "login failed");
    }
  }
);

export const register = createAsyncThunk(
  "auth/register",
  async (userData, { rejectWithValue }) => {
    try {
      const data = await registerUser(userData);
      return data;
    } catch (err) {
      return rejectWithValue(err.message || "registration failed");
    }
  }
);

export const verifyOtp = createAsyncThunk(
  "auth/verifyOtp",
  async ({ email, otp, token }, { rejectWithValue }) => {
    try {
      console.log("right");

      const data = await verifyUser({ email, otp, token });
      console.log(data);

      return data;
    } catch (err) {
      console.log("hey guys");

      return rejectWithValue(err.message || "verification failed");
    }
  }
);

export const resend = createAsyncThunk(
  "auth/resendOtp",
  async ({ email, token }, { rejectWithValue }) => {
    try {
      const data = await resendOtp({ email, token });
      return data;
    } catch (err) {
      return rejectWithValue(err.message || "resed otp failed");
    }
  }
);

// Forgot password thunks
export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async (email, { rejectWithValue }) => {
    try {
      const data = await requestPasswordReset(email);
      return data;
    } catch (err) {
      return rejectWithValue(err.message || "Failed to request password reset");
    }
  }
);

export const resendPasswordOtp = createAsyncThunk(
  "auth/resendPasswordOtp",
  async (email, { rejectWithValue }) => {
    try {
      const data = await resendPasswordResetOtp(email);
      return data;
    } catch (err) {
      return rejectWithValue(err.message || "Failed to resend password reset OTP");
    }
  }
);

export const resetPasswordWithOtp = createAsyncThunk(
  "auth/resetPassword",
  async (resetData, { rejectWithValue }) => {
    try {
      const data = await resetPassword(resetData);
      return data;
    } catch (err) {
      return rejectWithValue(err.message || "Failed to reset password");
    }
  }
);

export const logoutThunk = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      const data = await logoutUser();
      localStorage.removeItem('user');
      localStorage.removeItem('tokenAccess');
      localStorage.removeItem('tokenRefresh');
      return data;
    } catch (err) {
      return rejectWithValue(err.message || "logout failed");
    }
  }
);


export const refreshAccessTokenThunk = createAsyncThunk(
  "auth/refreshAccessToken",
  async (_, { rejectWithValue }) => {
    try {
      const data = await refreshAccessToken();
      // Check if data contains tokenAccess (API response format)
      if (data && data.tokenAccess) {
        localStorage.setItem('tokenAccess', data.tokenAccess);
        return data.tokenAccess; // Return the token for the reducer
      } else {
        throw new Error("Invalid token response format");
      }
    } catch (err) {
      console.error("Token refresh failed:", err.message);
      // Only remove tokens if it's an authentication error, not for network issues
      if (err.message.includes("unauthorized") || err.message.includes("invalid") || 
          err.message.includes("expired") || err.message.includes("No refresh token")) {
        localStorage.removeItem('tokenAccess');
        localStorage.removeItem('tokenRefresh');
        localStorage.removeItem('user');
      }
      return rejectWithValue(err.message || "refresh access token failed");
    }
  }
)


const initialState = {
  user: null,
  email: null,
  isVerified: false,
  loading: false,
  success: false,
  error: false,
  errormessage: null,
  successMessage: null, // Added proper field for success messages
  showOtpModal: false,
  token: null,
  otpExpiresAt: null, // Added to track OTP expiration time
  // Separate loading states for different actions
  verifyLoading: false,
  resendLoading: false,
  // Password reset states
  passwordResetEmail: null,
  passwordResetLoading: false,
  passwordResetSuccess: false,
  passwordResetError: false,
  passwordResetMessage: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    resetAuthState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = false;
      state.errormessage = null;
      state.successMessage = null; // Clear success message
      state.token = null;
      state.isVerified = false;
      state.showOtpModal = false;
    },
    setShowOtpModal: (state, action) => {
      state.showOtpModal = action.payload;
    },
    setAuthToken: (state, action) => {
      state.token = action.payload;
      state.isVerified = true;
      state.success = true;
      state.error = false;
      state.errormessage = null;
      
      // Try to get user data from localStorage if not already in state
      if (!state.user) {
        try {
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            state.user = JSON.parse(storedUser);
          }
        } catch (error) {
          console.error('Error parsing user from localStorage', error);
        }
      }
    },
    // logout: (state) => {
    //   state.token = null;
    //   state.user = null;
    //   state.isVerified = false;
    //   state.success = false;
      
    //   // Clear localStorage
    //   localStorage.removeItem('user');
    //   localStorage.removeItem('tokenAccess');
    //   localStorage.removeItem('tokenRefresh');
    // },
    setPasswordResetEmail: (state, action) => {
      state.passwordResetEmail = action.payload;
    },
    clearPasswordResetErrors: (state) => {
      // Clear only error states, preserve the email
      state.passwordResetLoading = false;
      state.passwordResetSuccess = false;
      state.passwordResetError = false;
      state.passwordResetMessage = null;
    },
    resetPasswordState: (state) => {
      state.passwordResetEmail = null;
      state.passwordResetLoading = false;
      state.passwordResetSuccess = false;
      state.passwordResetError = false;
      state.passwordResetMessage = null;
    },
    clearError: (state) => {
      // Clear only error states, preserve other states like showOtpModal
      state.loading = false;
      state.verifyLoading = false;
      state.resendLoading = false;
      state.error = false;
      state.errormessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = false;
        state.errormessage = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.error = false;
        state.errormessage = null;
        
        if (action.payload.isPasswordAddedToGoogleAccount) {
          // Special case: password added to Google account
          // Don't show OTP modal, just show success message
          state.showOtpModal = false;
          state.isVerified = true; // User is already verified through Google
          state.email = action.payload.email;
          state.successMessage = action.payload.message; // Store custom message in proper field
        } else {
          // Normal registration flow
          state.token = action.payload.token;
          state.showOtpModal = true;
          state.email = action.payload.email;
        }
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = true;
        state.errormessage = action.payload;
      });

    builder
      .addCase(verifyOtp.pending, (state) => {
        state.verifyLoading = true;
        state.success = false;
        state.error = false;
        state.errormessage = null;
      })
      .addCase(verifyOtp.fulfilled, (state) => {
        state.verifyLoading = false;
        state.success = true;
        state.isVerified = true;
        state.email = null;
        state.showOtpModal = false;
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.verifyLoading = false;
        state.error = true;
        state.errormessage = action.payload;
        // Only close the modal for session expiration, not for invalid OTP
        if (action.payload === "Registration session expired") {
          state.showOtpModal = false;
          state.email = null;
          state.token = null;
        }
      });

    builder
      .addCase(resend.pending, (state) => {
        state.resendLoading = true;
        state.success = false;
        state.error = false;
        state.errormessage = null;
      })
      .addCase(resend.fulfilled, (state, action) => {
        state.resendLoading = false;
        state.success = true;
        // Update the token with the new one containing the new OTP
        state.token = action.payload.token;
        // Store the expiration time for the OTP timer
        state.otpExpiresAt = action.payload.expiresAt;
      })
      .addCase(resend.rejected, (state, action) => {
        state.resendLoading = false;
        state.error = true;
        state.errormessage = action.payload;
        if (action.payload === "Registration session expired") {
          state.showOtpModal = false;
          state.email = null;
          state.token = null;
        }
      });
      builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = false;
        state.errormessage = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.error = false;
        state.errormessage = null;
        state.token = action.payload.tokenAccess;
        state.isVerified = true;
        state.user = action.payload.user;
        
        // Store user info and tokens in localStorage
        localStorage.setItem('user', JSON.stringify(action.payload.user));
        localStorage.setItem('tokenAccess', action.payload.tokenAccess);
        localStorage.setItem('tokenRefresh', action.payload.tokenRefresh);
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = true;
        state.errormessage = action.payload;
      });
      
    // Forgot password reducers
    builder
      .addCase(forgotPassword.pending, (state) => {
        state.passwordResetLoading = true;
        state.passwordResetSuccess = false;
        state.passwordResetError = false;
        state.passwordResetMessage = null;
      })
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.passwordResetLoading = false;
        state.passwordResetSuccess = true;
        state.passwordResetError = false;
        state.passwordResetMessage = action.payload.message;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.passwordResetLoading = false;
        state.passwordResetSuccess = false;
        state.passwordResetError = true;
        state.passwordResetMessage = action.payload;
      });
      
    builder
      .addCase(resendPasswordOtp.pending, (state) => {
        state.passwordResetLoading = true;
        state.passwordResetSuccess = false;
        state.passwordResetError = false;
        state.passwordResetMessage = null;
      })
      .addCase(resendPasswordOtp.fulfilled, (state, action) => {
        state.passwordResetLoading = false;
        state.passwordResetSuccess = true;
        state.passwordResetError = false;
        state.passwordResetMessage = action.payload.message;
      })
      .addCase(resendPasswordOtp.rejected, (state, action) => {
        state.passwordResetLoading = false;
        state.passwordResetSuccess = false;
        state.passwordResetError = true;
        state.passwordResetMessage = action.payload;
      });
      
    builder
      .addCase(resetPasswordWithOtp.pending, (state) => {
        state.passwordResetLoading = true;
        state.passwordResetSuccess = false;
        state.passwordResetError = false;
        state.passwordResetMessage = null;
      })
      .addCase(resetPasswordWithOtp.fulfilled, (state, action) => {
        state.passwordResetLoading = false;
        state.passwordResetSuccess = true;
        state.passwordResetError = false;
        state.passwordResetMessage = action.payload.message;
        state.passwordResetEmail = null; // Clear email after successful reset
      })
      .addCase(resetPasswordWithOtp.rejected, (state, action) => {
        state.passwordResetLoading = false;
        state.passwordResetSuccess = false;
        state.passwordResetError = true;
        state.passwordResetMessage = action.payload;
      });
      builder.addCase(logoutThunk.fulfilled,(state)=>{
        state.token=null;
        state.user=null;
        state.isVerified=false;
        state.success=false;
        
        
      })  
      .addCase(logoutThunk.rejected,(state,action)=>{
        state.error=true;
        state.errormessage=action.payload;  
      })

      builder.addCase(refreshAccessTokenThunk.pending, (state) => {
        state.loading = true;
        state.error = false;
        state.errormessage = null;
      })
      .addCase(refreshAccessTokenThunk.fulfilled,(state,action)=>{
        state.loading = false;
        state.token = action.payload;
        state.isVerified = true;
        state.error = false;
        state.errormessage = null;
      })
      .addCase(refreshAccessTokenThunk.rejected,(state,action)=>{
        state.loading = false;
        state.error = true;
        state.errormessage = action.payload;
        // Token refresh failed, clear auth state
        state.token = null;
        state.refreshToken = null;
        state.user = null;
        state.isVerified = false;
      })
  },
});

export const { resetAuthState, setShowOtpModal, setAuthToken, logout, setPasswordResetEmail, clearPasswordResetErrors, resetPasswordState, clearError } = authSlice.actions;
export default authSlice.reducer;
