import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getBanners, addBanner, editBanner, deleteBanner } from './adminBannerService';

export const fetchBannersThunk = createAsyncThunk(
  'banner/fetchAll',
  async ({ page = 1, size = 10, search = '' }, { rejectWithValue }) => {
    try {
      return await getBanners(page, size, search);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch banners');
    }
  }
);

export const addBannerThunk = createAsyncThunk(
  'banner/add',
  async (formData, { rejectWithValue }) => {
    try {
      return await addBanner(formData);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to add banner');
    }
  }
);

export const editBannerThunk = createAsyncThunk(
  'banner/edit',
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      return await editBanner(id, formData);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to edit banner');
    }
  }
);

export const deleteBannerThunk = createAsyncThunk(
  'banner/delete',
  async (id, { rejectWithValue }) => {
    try {
      return await deleteBanner(id);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete banner');
    }
  }
);

const bannerSlice = createSlice({
  name: 'banner',
  initialState: {
    banners: [],
    total: 0,
    page: 1,
    size: 10,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBannersThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBannersThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.banners = action.payload.banners;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.size = action.payload.size;
      })
      .addCase(fetchBannersThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addBannerThunk.fulfilled, (state, action) => {
        state.banners = [action.payload, ...state.banners];
        state.total += 1;
      })
      .addCase(editBannerThunk.fulfilled, (state, action) => {
        state.banners = state.banners.map((b) => (b._id === action.payload._id ? action.payload : b));
      })
      .addCase(deleteBannerThunk.fulfilled, (state, action) => {
        state.banners = state.banners.filter((b) => b._id !== action.payload);
        state.total -= 1;
      });
  },
});

export default bannerSlice.reducer;
