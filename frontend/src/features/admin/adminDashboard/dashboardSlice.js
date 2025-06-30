import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchDashboardStats } from "./dashboardService";

export const getDashboardStatsThunk = createAsyncThunk(
  'admin/getDashboardStats',
  async (params, { rejectWithValue }) => {
    try {
      const data = await fetchDashboardStats(params);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const dashboardSlice = createSlice({
  name: 'adminDashboard',
  initialState: {
    loading: false,
    data: null,
    error: false,
    errorMessage: null,
    filters: { range: 'year' },
  },
  reducers: {
    setFilters(state, action) {
      state.filters = action.payload;
    },
    clearError(state) {
      state.error = false;
      state.errorMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getDashboardStatsThunk.pending, (state) => {
        state.loading = true;
        state.error = false;
      })
      .addCase(getDashboardStatsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(getDashboardStatsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = true;
        state.errorMessage = action.payload;
      });
  },
});

export const { setFilters, clearError } = dashboardSlice.actions;
export default dashboardSlice.reducer;
