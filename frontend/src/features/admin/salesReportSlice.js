import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchSalesReport } from "../../services/admin/salesReportService";

export const getSalesReportThunk = createAsyncThunk(
  'admin/getSalesReport',
  async (params, { rejectWithValue }) => {
    try {
      const data = await fetchSalesReport(params);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const salesReportSlice = createSlice({
  name: 'salesReport',
  initialState: {
    loading: false,
    data: null,
    error: false,
    errorMessage: null,
    filters: { range: 'today' },
  },
  reducers: {
    setFilters(state, action) {
      state.filters = action.payload;
    },
    clearError(state){
      state.error=false;
      state.errorMessage=null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(getSalesReportThunk.pending, (state) => {
        state.loading = true;
        state.error = false;
      })
      .addCase(getSalesReportThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(getSalesReportThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = true;
        state.errorMessage = action.payload;
      });
  },
});

export const { setFilters, clearError } = salesReportSlice.actions;
export default salesReportSlice.reducer;
