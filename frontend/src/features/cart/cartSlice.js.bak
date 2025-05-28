import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { 
  getCartItems, 
  addItemToCart, 
  updateCartItemQuantity, 
  removeItemFromCart, 
  clearCartItems
} from './cartService';

// Async thunks
export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getCartItems();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch cart');
    }
  }
);

export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async (cartData, { rejectWithValue }) => {
    try {
      const response = await addItemToCart(cartData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add to cart');
    }
  }
);

export const updateCartItem = createAsyncThunk(
  'cart/updateCartItem',
  async ({ cartItemId, quantity }, { rejectWithValue }) => {
    try {
      const response = await updateCartItemQuantity(cartItemId, quantity);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update cart item');
    }
  }
);

export const removeFromCart = createAsyncThunk(
  'cart/removeFromCart',
  async (cartItemId, { rejectWithValue }) => {
    try {
      await removeItemFromCart(cartItemId);
      return { cartItemId };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove from cart');
    }
  }
);

export const clearCart = createAsyncThunk(
  'cart/clearCart',
  async (_, { rejectWithValue }) => {
    try {
      const response = await clearCartItems();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to clear cart');
    }
  }
);

// Initial state
const initialState = {
  items: [],
  count: 0,
  summary: {
    subtotal: 0,
    discount: 0,
    total: 0
  },
  loading: false,
  error: null,
  addingToCart: false,
  updatingCart: false,
  removingFromCart: false,
  clearingCart: false
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    clearCartError(state) {
      state.error = null;
    },
    resetCart() {
      return initialState;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch cart
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.cartItems || [];
        state.count = action.payload.count || 0;
        state.summary = action.payload.summary || {
          subtotal: 0,
          discount: 0,
          total: 0
        };
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch cart';
      })
      
      // Add to cart
      .addCase(addToCart.pending, (state) => {
        state.addingToCart = true;
        state.error = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.addingToCart = false;
        // We'll refetch the cart to get the updated state
        // This ensures we have the correct totals and item count
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.addingToCart = false;
        state.error = action.payload || 'Failed to add to cart';
      })
      
      // Update cart item
      .addCase(updateCartItem.pending, (state) => {
        state.updatingCart = true;
        state.error = null;
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.updatingCart = false;
        // We'll refetch the cart to get the updated state with correct totals
      })
      .addCase(updateCartItem.rejected, (state, action) => {
        state.updatingCart = false;
        state.error = action.payload || 'Failed to update cart item';
      })
      
      // Remove from cart
      .addCase(removeFromCart.pending, (state) => {
        state.removingFromCart = true;
        state.error = null;
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.removingFromCart = false;
        state.items = state.items.filter(item => item._id !== action.payload.cartItemId);
        state.count = state.count > 0 ? state.count - 1 : 0;
        // Note: We should refetch the cart to get updated totals
      })
      .addCase(removeFromCart.rejected, (state, action) => {
        state.removingFromCart = false;
        state.error = action.payload || 'Failed to remove from cart';
      })
      
      // Clear cart
      .addCase(clearCart.pending, (state) => {
        state.clearingCart = true;
        state.error = null;
      })
      .addCase(clearCart.fulfilled, (state) => {
        state.clearingCart = false;
        state.items = [];
        state.count = 0;
        state.summary = {
          subtotal: 0,
          discount: 0,
          total: 0
        };
      })
      .addCase(clearCart.rejected, (state, action) => {
        state.clearingCart = false;
        state.error = action.payload || 'Failed to clear cart';
      });
  }
});

export const { clearCartError, resetCart } = cartSlice.actions;
export default cartSlice.reducer;
