import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { adminLogin, logout, refresh } from "./adminAuthService";
import { act } from "react";

export const loginThunk = createAsyncThunk(
  "adminAuth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const data = await adminLogin(credentials);
      const { tokenAccess, tokenRefresh, admin } = data;
      localStorage.setItem("accessToken", tokenAccess);
      localStorage.setItem("refreshToken", tokenRefresh);
      return { accessToken: tokenAccess, refreshToken: tokenRefresh, admin };
    } catch (err) {
      return rejectWithValue(
        err.response?.data.message || "error while logging"
      );
    }
  }
);

export const refreshTokenThunk = createAsyncThunk(
  "adminAuth/refresh",
  async (_, { rejectWithValue }) => {
    try {
      const storedRefresh = localStorage.getItem("refreshToken");
      if (!storedRefresh) {
        throw new Error("no refresh token avilable");
      }
      const data = await refresh(storedRefresh);
      const { accessToken } = data;
      localStorage.setItem("accessToken", accessToken);
      return accessToken;
    } catch (err) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      return rejectWithValue(
        err.response?.data.messsage 
      );
    }
  }
);

export const logoutThunk = createAsyncThunk(
  "adminAuth/logout",
  async (adminId, { rejectWithValue }) => {
    try {
      const data = await logout(adminId);

      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      return data
    } catch (er) {
      return rejectWithValue(err.response?.data.message || "error ");
    }
  }
);

const initialState = {
  loading: false,
  error: null,
  refreshToken: localStorage.getItem("refreshToken") || null,
  accessToken: localStorage.getItem("accessToken") || null,
  adminInfo: null,
  isAuthenticated: !!localStorage.getItem("accessToken"),
};

const adminAuthSlice = createSlice({
  name: "adminAuth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearState: (state) => {
      return {
        ...initialState,
        refreshToken: state.refreshToken,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated
      };
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.error = false;
        state.adminInfo = action.payload.admin;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.accessToken = null;
        state.refreshToken = null;
        state.adminInfo = null;
        state.isAuthenticated = false;
      });
    builder
      .addCase(refreshTokenThunk.fulfilled, (state, action) => {
        state.accessToken = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(refreshTokenThunk.rejected, (state, action) => {
        state.error = action.payload;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
      });
    builder
      .addCase(logoutThunk.pending, (state, action) => {
        // state.loading=true
        state.error = null;
      })
      .addCase(logoutThunk.fulfilled, (state, action) => {
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
      })
      .addCase(logoutThunk.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});
export const {clearError,clearState} =adminAuthSlice.actions
export default adminAuthSlice.reducer;
