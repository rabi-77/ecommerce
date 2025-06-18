import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchOffers, removeOffer, toggleOffer, getOffer, createOffer, updateOffer } from './offerService';

// Thunks
export const getOffers = createAsyncThunk(
  'offers/getAll',
  async ({ page = 1, limit = 10, type = '' }, { rejectWithValue }) => {
    try {
      const data = await fetchOffers({ page, limit, type });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch offers');
    }
  }
);

export const deleteOffer = createAsyncThunk(
  'offers/delete',
  async (id, { rejectWithValue }) => {
    try {
      await removeOffer(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete offer');
    }
  }
);

export const toggleStatus = createAsyncThunk(
  'offers/toggle',
  async (id, { rejectWithValue }) => {
    try {
      const data = await toggleOffer(id);
      return { id, isActive: data.isActive };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to toggle offer');
    }
  }
);

export const getSingleOffer = createAsyncThunk(
  'offers/getOne',
  async (id, { rejectWithValue }) => {
    try {
      const data = await getOffer(id);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch offer');
    }
  }
);

export const createNewOffer = createAsyncThunk(
  'offers/create',
  async (offerData, { rejectWithValue }) => {
    try {
      const data = await createOffer(offerData);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create offer');
    }
  }
);

export const updateExistingOffer = createAsyncThunk(
  'offers/update',
  async ({ id, ...offerData }, { rejectWithValue }) => {
    try {
      const data = await updateOffer({ id, ...offerData });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update offer');
    }
  }
);

// Initial state
const initialState = {
  offers: [],
  loading: false,
  error: null,
  success: false,
  currentOffer: null,
  pagination: {
    page: 1,
    pages: 1,
    total: 0,
    limit: 10,
  },
};

// Slice
const offerSlice = createSlice({
  name: 'offers',
  initialState,
  reducers: {
    resetOfferState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.currentOffer = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get offers
      .addCase(getOffers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getOffers.fulfilled, (state, action) => {
        state.loading = false;
        state.offers = action.payload.offers;
        state.pagination = {
          page: action.payload.currentPage,
          pages: action.payload.totalPages,
          total: action.payload.total,
          limit: 10,
        };
      })
      .addCase(getOffers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete offer
      .addCase(deleteOffer.fulfilled, (state, action) => {
        state.offers = state.offers.filter((o) => o._id !== action.payload);
      })
      // Toggle status
      .addCase(toggleStatus.fulfilled, (state, action) => {
        const target = state.offers.find((o) => o._id === action.payload.id);
        if (target) target.isActive = action.payload.isActive;
      })
      // Create Offer
      .addCase(createNewOffer.fulfilled, (state) => {
        state.success = true;
      })
      // Update Offer
      .addCase(updateExistingOffer.fulfilled, (state) => {
        state.success = true;
      })
      // Get single
      .addCase(getSingleOffer.fulfilled, (state, action) => {
        state.currentOffer = action.payload;
      })
      // Generic error handler
      .addMatcher((action) => action.type.endsWith('rejected'), (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { resetOfferState } = offerSlice.actions;
export default offerSlice.reducer;
