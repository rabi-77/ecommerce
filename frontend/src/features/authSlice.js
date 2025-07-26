import {
  createSlice,
  createAsyncThunk,
  buildCreateSlice,
} from "@reduxjs/toolkit";
import { registerUser, verifyUser, resendOtp, loginUser, requestPasswordReset, resendPasswordResetOtp, resetPassword ,logoutUser,refreshAccessToken} from "../services/authServices";
import { updateProfile } from "./userprofile/profileSlice"; 
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
      const data = await verifyUser({ email, otp, token });
      return data;
    } catch (err) {
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
      if (data && data.tokenAccess) {
        localStorage.setItem('tokenAccess', data.tokenAccess);
        
        const userData = localStorage.getItem('user');
        return {
          tokenAccess: data.tokenAccess,
          user: userData ? JSON.parse(userData) : null
        };
      } else {
        throw new Error("Invalid token response format");
      }
    } catch (err) {
      console.error("Token refresh failed:", err.message);
      if (err.message.includes("unauthorized") || err.message.includes("invalid") || 
          err.message.includes("expired") || err.message.includes("No refresh token")) {
        localStorage.removeItem('tokenAccess');
        localStorage.removeItem('tokenRefresh');
        localStorage.removeItem('user');
      }
      return rejectWithValue(err.message);
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
  successMessage: null, 
  showOtpModal: false,
  token: null,
  otpExpiresAt: null, 
  invalidReferral: localStorage.getItem('invalidReferral') === 'true',
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
      state.successMessage = null; 
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
          state.showOtpModal = false;
          state.isVerified = true; 
          state.email = action.payload.email;
          state.successMessage = action.payload.message; 
        } else {
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
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.verifyLoading = false;
        state.success = true;
        state.isVerified = true;
        state.email = null;
        state.showOtpModal = false;

        const status = action.payload?.referralStatus;
        if (status === 'INVALID') {
          state.invalidReferral = true;
          localStorage.setItem('invalidReferral', 'true');
        } else {
          state.invalidReferral = false;
          localStorage.removeItem('invalidReferral');
        }
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.verifyLoading = false;
        state.error = true;
        state.errormessage = action.payload;
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
        state.token = action.payload.token;
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
        
        localStorage.setItem('user', JSON.stringify(action.payload.user));
        localStorage.setItem('tokenAccess', action.payload.tokenAccess);
        localStorage.setItem('tokenRefresh', action.payload.tokenRefresh);
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = true;
        state.errormessage = action.payload;
      });
      
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
        state.passwordResetEmail = null; 
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
        state.token = action.payload.tokenAccess;
        state.user = action.payload.user;
        state.isVerified = true;
        state.error = false;
        state.errormessage = null;
      })
      .addCase(refreshAccessTokenThunk.rejected,(state,action)=>{
        state.loading = false;
        state.error = true;
        state.errormessage = action.payload;
        state.token = null;
        state.refreshToken = null;
        state.user = null;
        state.isVerified = false;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        if (action.payload && action.payload.user) {
          state.user = action.payload.user;
        }
      });
  },
});

export const { resetAuthState, setShowOtpModal, setAuthToken, logout, setPasswordResetEmail, clearPasswordResetErrors, resetPasswordState, clearError } = authSlice.actions;
export default authSlice.reducer;
