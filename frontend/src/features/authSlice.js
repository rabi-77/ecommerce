import {
  createSlice,
  createAsyncThunk,
  buildCreateSlice,
} from "@reduxjs/toolkit";
import { registerUser, verifyUser, resendOtp,loginUser } from "../services/authServices";
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
      rejectWithValue(err.message || "resed otp failed");
    }
  }
);
const initialState = {
  user: null,
  email: null,
  isVerified: false,
  loading: false,
  success: false,
  error: false,
  errormessage: null,
  showOtpModal: false,
  token: null,
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
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.isVerified = false;
      state.success = false;
      
      // Clear localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('tokenAccess');
      localStorage.removeItem('tokenRefresh');
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
        state.token = action.payload.token;
        state.showOtpModal = true;
        state.email = action.payload.email;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = true;
        state.errormessage = action.payload;
      });

    builder
      .addCase(verifyOtp.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = false;
        state.errormessage = null;
      })
      .addCase(verifyOtp.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
        state.isVerified = true;
        state.email = null;
        state.showOtpModal = false;
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = true;
        state.errormessage = action.payload;
        if (
          action.payload === "Registration session expired" ||
          action.payload === "Invalid OTP"
        ) {
          state.showOtpModal = false;
          state.email = null;
          state.token = null;
        }
      });

    builder
      .addCase(resend.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = false;
        state.errormessage = null;
      })
      .addCase(resend.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.token = action.payload.token;
        state.showOtpModal = true;
      })
      .addCase(resend.rejected, (state, action) => {
        state.loading = false;
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
  },
});

export const { resetAuthState, setShowOtpModal, setAuthToken, logout } = authSlice.actions;
export default authSlice.reducer;
