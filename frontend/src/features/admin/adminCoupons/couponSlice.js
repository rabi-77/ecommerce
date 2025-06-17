import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  getCoupons as fetchCoupons,
  getCoupon,
  createCoupon as createNewCoupon,
  updateCoupon as updateExistingCoupon,
  deleteCoupon as removeCoupon,
  toggleCouponStatus,
  validateCoupon as validateCouponApi,
} from './couponService';

const initialState = {
  coupons: [],
  currentCoupon: null,
  loading: false,
  error: null,
  success: false,
  validation: {
    loading: false,
    valid: false,
    data: null,
    error: null,
  },
  pagination: {
    page: 1,
    pages: 1,
    total: 0,
    limit: 10,
  },
};

export const getCoupons = createAsyncThunk(
  'coupons/getAll',
  async ({ page = 1, limit = 10, search = '' }, { rejectWithValue }) => {
    try {
      const response = await fetchCoupons({ page, limit, search });
      return response;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch coupons'
      );
    }
  }
);

export const getSingleCoupon = createAsyncThunk(
  'coupons/getOne',
  async (id, { rejectWithValue }) => {
    try {
      const response = await getCoupon(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch coupon'
      );
    }
  }
);

export const createCoupon = createAsyncThunk(
  'coupons/create',
  async (couponData, { rejectWithValue }) => {
    try {
      const response = await createNewCoupon(couponData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message||error.response?.data?.errors[0].msg || 'Failed to create coupon'
      );
    }
  }
);

export const updateCoupon = createAsyncThunk(
  'coupons/update',
  async ({ id, ...couponData }, { rejectWithValue }) => {
    try {
      const response = await updateExistingCoupon({ id, ...couponData });
      return response.data;
    } catch (error) {
      console.log(error.response?.data)
      return rejectWithValue(
        error.response?.data?.message||error.response?.data?.errors[0].msg || 'Failed to update coupon'
      );
    }
  }
);

export const deleteCoupon = createAsyncThunk(
  'coupons/delete',
  async (id, { rejectWithValue }) => {
    try {
      await removeCoupon(id);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete coupon'
      );
    }
  }
);

export const toggleStatus = createAsyncThunk(
  'coupons/toggleStatus',
  async (id, { rejectWithValue }) => {
    try {
      const response = await toggleCouponStatus(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to toggle coupon status'
      );
    }
  }
);

export const validateCoupon = createAsyncThunk(
  'coupons/validate',
  async ({ code, amount }, { rejectWithValue }) => {
    try {
      const response = await validateCouponApi(code, amount);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Invalid coupon code'
      );
    }
  }
);

const couponSlice = createSlice({
  name: 'coupons',
  initialState,
  reducers: {
    resetCouponState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.currentCoupon = null;
    },
    resetValidation: (state) => {
      state.validation = {
        loading: false,
        valid: false,
        data: null,
        error: null,
      };
    },
  },
  extraReducers: (builder) => {
    // Get all coupons
    builder
      .addCase(getCoupons.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCoupons.fulfilled, (state, action) => {
        state.loading = false;
        state.coupons = action.payload.data;
        state.pagination = {
          page: action.payload.pagination.page,
          pages: action.payload.pagination.pages,
          total: action.payload.pagination.total,
          limit: action.payload.pagination.limit,
        };
      })
      .addCase(getCoupons.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Get single coupon
    builder
      .addCase(getSingleCoupon.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getSingleCoupon.fulfilled, (state, action) => {
        state.loading = false;
        state.currentCoupon = action.payload;
      })
      .addCase(getSingleCoupon.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Create coupon
    builder
      .addCase(createCoupon.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createCoupon.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.coupons.unshift(action.payload);
      })
      .addCase(createCoupon.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      });

    // Update coupon
    builder
      .addCase(updateCoupon.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateCoupon.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        const index = state.coupons.findIndex(
          (coupon) => coupon._id === action.payload._id
        );
        if (index !== -1) {
          state.coupons[index] = action.payload;
        }
        if (state.currentCoupon?._id === action.payload._id) {
          state.currentCoupon = action.payload;
        }
      })
      .addCase(updateCoupon.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      });

    // Delete coupon
    builder
      .addCase(deleteCoupon.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCoupon.fulfilled, (state, action) => {
        state.loading = false;
        state.coupons = state.coupons.filter(
          (coupon) => coupon._id !== action.payload
        );
        if (state.currentCoupon?._id === action.payload) {
          state.currentCoupon = null;
        }
      })
      .addCase(deleteCoupon.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Toggle coupon status
    builder
      .addCase(toggleStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleStatus.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.coupons.findIndex(
          (coupon) => coupon._id === action.payload._id
        );
        if (index !== -1) {
          state.coupons[index] = action.payload;
        }
        if (state.currentCoupon?._id === action.payload._id) {
          state.currentCoupon = action.payload;
        }
      })
      .addCase(toggleStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Validate coupon
    builder
      .addCase(validateCoupon.pending, (state) => {
        state.validation.loading = true;
        state.validation.error = null;
        state.validation.valid = false;
      })
      .addCase(validateCoupon.fulfilled, (state, action) => {
        state.validation.loading = false;
        state.validation.valid = true;
        state.validation.data = action.payload;
      })
      .addCase(validateCoupon.rejected, (state, action) => {
        state.validation.loading = false;
        state.validation.error = action.payload;
        state.validation.valid = false;
        state.validation.data = null;
      });
  },
});

export const { resetCouponState, resetValidation } = couponSlice.actions;
export default couponSlice.reducer;
