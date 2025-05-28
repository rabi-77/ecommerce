import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import adminOrderService from './adminOrderService';

const initialState = {
  orders: [],
  total: 0,
  page: 1,
  size: 10,
  totalPages: 0,
  loading: false,
  error: null,
  success: false,
  updatingStatus: false,
  statusUpdateSuccess: false,
  verifyingReturn: false,
  verifyReturnSuccess: false
};

// Get all orders with pagination and search
export const getAllOrders = createAsyncThunk(
  'adminOrders/getAll',
  async ({ page = 1, size = 10, search = '' }, thunkAPI) => {
    try {
      return await adminOrderService.getAllOrders(page, size, search);
    } catch (error) {
      const message = 
        (error.response && 
          error.response.data && 
          error.response.data.message) ||
        error.message ||
        error.toString();
      
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Update order status
export const updateOrderStatus = createAsyncThunk(
  'adminOrders/updateStatus',
  async ({ orderId, status }, thunkAPI) => {
    try {
      return await adminOrderService.updateOrderStatus(orderId, status);
    } catch (error) {
      const message = 
        (error.response && 
          error.response.data && 
          error.response.data.message) ||
        error.message ||
        error.toString();
      
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Verify return request
export const verifyReturnRequest = createAsyncThunk(
  'adminOrders/verifyReturn',
  async ({ orderId, itemId, approved, notes }, thunkAPI) => {
    try {
      return await adminOrderService.verifyReturnRequest(orderId, itemId, { approved, notes });
    } catch (error) {
      const message = 
        (error.response && 
          error.response.data && 
          error.response.data.message) ||
        error.message ||
        error.toString();
      
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const adminOrderSlice = createSlice({
  name: 'adminOrders',
  initialState,
  reducers: {
    resetOrderState: (state) => {
      state.success = false;
      state.error = null;
      state.statusUpdateSuccess = false;
      state.verifyReturnSuccess = false;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Get all orders
      .addCase(getAllOrders.pending, (state) => {
        state.loading = true;
      })
      .addCase(getAllOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.orders = action.payload.items;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.size = action.payload.size;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(getAllOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update order status
      .addCase(updateOrderStatus.pending, (state) => {
        state.updatingStatus = true;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.updatingStatus = false;
        state.statusUpdateSuccess = true;
        // Update the order in the state
        const updatedOrder = action.payload.order;
        state.orders = state.orders.map(order => 
          order._id === updatedOrder._id ? updatedOrder : order
        );
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.updatingStatus = false;
        state.error = action.payload;
      })
      
      // Verify return request
      .addCase(verifyReturnRequest.pending, (state) => {
        state.verifyingReturn = true;
      })
      .addCase(verifyReturnRequest.fulfilled, (state, action) => {
        state.verifyingReturn = false;
        state.verifyReturnSuccess = true;
        // We'll need to refresh the orders after a successful verification
        // This will be handled by re-fetching the orders in the component
      })
      .addCase(verifyReturnRequest.rejected, (state, action) => {
        state.verifyingReturn = false;
        state.error = action.payload;
      });
  }
});

export const { resetOrderState, clearError } = adminOrderSlice.actions;
export default adminOrderSlice.reducer;
