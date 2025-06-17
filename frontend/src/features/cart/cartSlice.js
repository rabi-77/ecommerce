import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { 
  getCartItems, 
  addItemToCart, 
  updateCartItemQuantity, 
  removeItemFromCart, 
  clearCartItems,
  validateCoupon as validateCouponService,
  applyCouponToCart,
  removeCouponFromCart,
} from './cartService';
import { toast } from 'react-toastify';

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



export const applyCoupon = createAsyncThunk(
  'cart/applyCoupon',
  async (couponCode, { rejectWithValue }) => {
    try {
      const response = await applyCouponToCart(couponCode);
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to apply coupon');
      return rejectWithValue(error.response?.data?.message || 'Failed to apply coupon');
    }
  }
);

export const removeCoupon = createAsyncThunk(
  'cart/removeCoupon',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await removeCouponFromCart();
      return {
        total: data.total || 0
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove coupon');
    }
  }
);

export const validateCoupon = createAsyncThunk(
  'cart/validateCoupon',
  async (couponCode, { rejectWithValue }) => {
    try {
      const response = await api.post('/coupons/validate', { code: couponCode });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to validate coupon');
    }
  }
);

// Initial state
const initialState = {
  items: [],
  count: 0,
  loading: false,
  error: null,
  coupon: null,
  discount: 0,
  subtotal: 0,
  total: 0,
  couponLoading: false,
  removingCoupon: false,
  couponError: null,
  summary: {
    subtotal: 0,
    discount: 0,
    total: 0
  },
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
      state.couponError = null;
    },
    resetCart() {
      return initialState;
    },
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
        
        // Update summary
        state.summary = {
          subtotal: action.payload.summary?.subtotal || 0,
          discount: action.payload.summary?.discount || 0,
          total: action.payload.summary?.total || 0,
        };
        
        // Update coupon and discount
        state.coupon = action.payload.coupon || null;
        state.discount = action.payload.summary?.discount || 0;
        state.subtotal = action.payload.summary?.subtotal || 0;
        state.total = action.payload.summary?.total || 0;
        
        // Reset coupon loading states
        state.couponLoading = false;
        state.couponError = null;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch cart';
        state.couponLoading = false;
      })

      // Add to cart
      .addCase(addToCart.pending, (state) => {
        state.addingToCart = true;
        state.error = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.addingToCart = false;
        state.items = action.payload.items || [];
        state.count = action.payload.count || 0;
        
        // Update summary
        state.summary = {
          subtotal: action.payload.summary?.subtotal || 0,
          discount: action.payload.summary?.discount || 0,
          total: action.payload.summary?.total || 0,
        };
        
        // Update coupon and discount
        state.coupon = action.payload.coupon || state.coupon;
        state.discount = action.payload.summary?.discount || 0;
        state.subtotal = action.payload.summary?.subtotal || 0;
        state.total = action.payload.summary?.total || 0;
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.addingToCart = false;
        state.error = action.payload || 'Failed to add to cart';
      })

      // Update cart item
      .addCase(updateCartItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items || [];
        state.summary = action.payload.summary || state.summary;
        // Update coupon and discount if present
        if (action.payload.coupon) {
          state.coupon = action.payload.coupon;
          state.discount = action.payload.summary?.discount || 0;
        } else if (action.payload.summary) {
          // Update discount from summary if no coupon
          state.discount = action.payload.summary.discount || 0;
        }
        state.subtotal = action.payload.summary?.subtotal || 0;
        state.total = action.payload.summary?.total || 0;
      })
      .addCase(updateCartItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update cart item';
      })

      // Remove from cart
      .addCase(removeFromCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter(item => item._id !== action.payload.cartItemId);
        state.count = Math.max(0, state.count - 1);
        // Update summary if provided
        if (action.payload.summary) {
          state.summary = action.payload.summary;
          state.subtotal = action.payload.summary.subtotal || 0;
          state.discount = action.payload.summary.discount || 0;
          state.total = action.payload.summary.total || 0;
        }
      })
      .addCase(removeFromCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to remove from cart';
      })

      // Clear cart
      .addCase(clearCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(clearCart.fulfilled, (state) => {
        state.loading = false;
        state.items = [];
        state.count = 0;
        state.summary = {
          subtotal: 0,
          discount: 0,
          total: 0,
        };
        state.coupon = null;
        state.discount = 0;
        state.subtotal = 0;
        state.total = 0;
      })
      .addCase(clearCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to clear cart';
      })

      // Apply coupon
      .addCase(applyCoupon.pending, (state) => {
        state.couponLoading = true;
        state.couponError = null;
      })
      .addCase(applyCoupon.fulfilled, (state, action) => {
        state.couponLoading = false;
        state.coupon = action.payload.coupon;

        // Backend may return full summary OR just discount/total
        if (action.payload.summary) {
          state.summary = action.payload.summary;
        } else {
          state.summary = {
            ...state.summary,
            discount: action.payload.discount || 0,
            total:    action.payload.total    ?? state.summary.total,
          };
        }
      })
      .addCase(applyCoupon.rejected, (state, action) => {
        state.couponLoading = false;
        state.couponError = action.payload || 'Failed to apply coupon';
      })
      
      // Remove coupon
      .addCase(removeCoupon.pending, (state) => {
        state.removingCoupon = true;
        state.couponError = null;
      })
      .addCase(removeCoupon.fulfilled, (state) => {
        state.removingCoupon = false;
        state.coupon = null;
        state.summary = {
          ...state.summary,
          discount: 0,
          total: state.summary.subtotal    // revert to subtotal when coupon removed
        };
      })
      .addCase(removeCoupon.rejected, (state, action) => {
        state.removingCoupon = false;
        state.couponError = action.payload || 'Failed to remove coupon';
      });
  }
});

export const { 
  clearCartError, 
  resetCart, 
  resetCouponValidation 
} = cartSlice.actions;

export default cartSlice.reducer;
