import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { 
  getWishlistItems, 
  addItemToWishlist, 
  removeItemFromWishlist, 
  clearWishlistItems,
  checkWishlistItemStatus
} from './wishlistService';

// Async thunks
export const fetchWishlist = createAsyncThunk(
  'wishlist/fetchWishlist',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getWishlistItems();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch wishlist');
    }
  }
);

export const addToWishlist = createAsyncThunk(
  'wishlist/addToWishlist',
  async (productId, { rejectWithValue }) => {
    try {
      const response = await addItemToWishlist(productId);
      return { ...response.data, productId };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add to wishlist');
    }
  }
);

export const removeFromWishlist = createAsyncThunk(
  'wishlist/removeFromWishlist',
  async (productId, { rejectWithValue }) => {
    try {
      await removeItemFromWishlist(productId);
      return { productId };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove from wishlist');
    }
  }
);

export const clearWishlist = createAsyncThunk(
  'wishlist/clearWishlist',
  async (_, { rejectWithValue }) => {
    try {
      const response = await clearWishlistItems();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to clear wishlist');
    }
  }
);

export const checkWishlistItem = createAsyncThunk(
  'wishlist/checkWishlistItem',
  async (productId, { rejectWithValue }) => {
    try {
      const response = await checkWishlistItemStatus(productId);
      return { productId, inWishlist: response.data.inWishlist };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to check wishlist status');
    }
  }
);

// Initial state
const initialState = {
  items: [],
  itemsCount: 0,
  loading: false,
  error: null,
  productStatuses: {}, // Tracks if specific products are in wishlist
};

// Slice
const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    clearWishlistError: (state) => {
      state.error = null;
    },
    setProductInWishlist: (state, action) => {
      const { productId, inWishlist } = action.payload;
      state.productStatuses[productId] = inWishlist;
    },
    resetWishlist: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Fetch wishlist
      .addCase(fetchWishlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.wishlist || [];
        state.itemsCount = action.payload.count || 0;
        
        // Update product statuses
        state.items.forEach(item => {
          if (item.product && item.product._id) {
            state.productStatuses[item.product._id] = true;
          }
        });
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch wishlist';
      })
      
      // Add to wishlist
      .addCase(addToWishlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addToWishlist.fulfilled, (state, action) => {
        state.loading = false;
        state.productStatuses[action.payload.productId] = true;
        state.itemsCount= state.itemsCount+1
        // We'll refresh the full wishlist after adding an item
        // to get the populated product data
      })
      .addCase(addToWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to add to wishlist';
      })
      
      // Remove from wishlist
      .addCase(removeFromWishlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeFromWishlist.fulfilled, (state, action) => {
        state.loading = false;
        state.productStatuses[action.payload.productId] = false;
        state.items = state.items.filter(
          item => item.product && item.product._id !== action.payload.productId
        );
        state.itemsCount = state.items.length;
      })
      .addCase(removeFromWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to remove from wishlist';
      })
      
      // Clear wishlist
      .addCase(clearWishlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(clearWishlist.fulfilled, (state) => {
        state.loading = false;
        state.items = [];
        state.itemsCount = 0;
        state.productStatuses = {};
      })
      .addCase(clearWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to clear wishlist';
      })
      
      // Check wishlist item
      .addCase(checkWishlistItem.fulfilled, (state, action) => {
        state.productStatuses[action.payload.productId] = action.payload.inWishlist;
      });
  },
});

export const { clearWishlistError, setProductInWishlist, resetWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;
