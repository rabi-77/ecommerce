import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import orderService, {
  createOrder as createOrderService,
  getOrderDetails as getOrderDetailsService,
  getMyOrders as getMyOrdersService,
  cancelOrder as cancelOrderService,
  cancelOrderItem as cancelOrderItemService,
  returnOrder as returnOrderService,
  returnOrderItem as returnOrderItemService,
  downloadInvoice as downloadInvoiceService,
  cancelUnpaidPending as cancelUnpaidPendingService,
  markPaymentFailed as markPaymentFailedService,
} from './orderService';

const initialState = {
  orders: [],
  order: null,
  loading: false,
  success: false,
  error: null,
  creatingOrder: false,
  orderCreated: false,
  fetchingOrders: false,
  fetchingOrderDetails: false,
  cancellingOrder: false,
  cancellingItem: false,
  returningOrder: false,
  returningItem: false,
  downloadingInvoice: false
};

// Create new order
export const createOrder = createAsyncThunk(
  'order/create',
  async (orderData, thunkAPI) => {
    try {
      const response = await createOrderService(orderData);
      return response.data;
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

// Get order details
export const getOrderDetails = createAsyncThunk(
  'order/getDetails',
  async (orderId, thunkAPI) => {
    try {
      console.log('orderis',orderId);
      
      const response = await getOrderDetailsService(orderId);
      console.log(response.data);
      
      return response.data;
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

// Get user orders
export const getMyOrders = createAsyncThunk(
  'order/getMyOrders',
  async ({ keyword = '', status = '' } = {}, thunkAPI) => {
    try {
      const response = await getMyOrdersService(keyword, status);
      return response.data;
    } catch (error) {
      console.log(error.message);
      
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

// Cancel order
export const cancelOrder = createAsyncThunk(
  'order/cancel',
  async ({ orderId, reason }, thunkAPI) => {
    try {
      const response = await cancelOrderService(orderId, reason);
      return response.data;
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

// Cancel order item
export const cancelOrderItem = createAsyncThunk(
  'order/cancelItem',
  async ({ orderId, itemId, reason }, thunkAPI) => {
    try {
      const response = await cancelOrderItemService(orderId, itemId, reason);
      return response.data;
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

// Return order
export const returnOrder = createAsyncThunk(
  'order/return',
  async ({ orderId, reason }, thunkAPI) => {
    try {
      const response = await returnOrderService(orderId, reason);
      return response.data;
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

// Return order item
export const returnOrderItem = createAsyncThunk(
  'order/returnItem',
  async ({ orderId, itemId, reason }, thunkAPI) => {
    try {
      const response = await returnOrderItemService(orderId, itemId, reason);
      return response.data;
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

// Delete unpaid pending order
export const cancelUnpaidPending = createAsyncThunk(
  'order/cancelUnpaid',
  async (orderId, thunkAPI) => {
    try {
      const response = await cancelUnpaidPendingService(orderId);
      return response.data;
    } catch (error) {
      const message =
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Mark payment failed
export const markPaymentFailed = createAsyncThunk(
  'order/markPaymentFailed',
  async (orderId, thunkAPI) => {
    try {
      const res = await markPaymentFailedService(orderId);
      return res.data;
    } catch (error) {
      const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Download invoice
export const downloadInvoice = createAsyncThunk(
  'order/downloadInvoice',
  async (orderId, thunkAPI) => {
    try {
      await downloadInvoiceService(orderId);
      return { success: true };
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

export const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    resetOrderState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
    },
    resetOrderCreated: (state) => {
      state.orderCreated = false;
    },
    clearOrderDetails: (state) => {
      state.order = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Create order
      .addCase(createOrder.pending, (state) => {
        state.creatingOrder = true;
        state.orderCreated = false;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.creatingOrder = false;
        state.orderCreated = true;
        state.order = action.payload.order;
        state.success = true;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.creatingOrder = false;
        state.orderCreated = false;
        state.error = action.payload;
      })
      
      // Get order details
      .addCase(getOrderDetails.pending, (state) => {
        state.fetchingOrderDetails = true;
        state.error = null;
      })
      .addCase(getOrderDetails.fulfilled, (state, action) => {
        state.fetchingOrderDetails = false;
        state.order = action.payload.order;
        state.success = true;
      })
      .addCase(getOrderDetails.rejected, (state, action) => {
        state.fetchingOrderDetails = false;
        state.error = action.payload;
      })
      
      // Get my orders
      .addCase(getMyOrders.pending, (state) => {
        state.fetchingOrders = true;
        state.error = null;
      })
      .addCase(getMyOrders.fulfilled, (state, action) => {
        state.fetchingOrders = false;
        state.orders = action.payload.orders;
        state.success = true;
      })
      .addCase(getMyOrders.rejected, (state, action) => {
        state.fetchingOrders = false;
        state.error = action.payload;
      })
      
      // Cancel order
      .addCase(cancelOrder.pending, (state) => {
        state.cancellingOrder = true;
        state.error = null;
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.cancellingOrder = false;
        state.order = action.payload.order;
        
        // Update the order in the orders array
        const index = state.orders.findIndex(
          (order) => order._id === action.payload.order._id
        );
        
        if (index !== -1) {
          state.orders[index] = action.payload.order;
        }
        
        state.success = true;
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        state.cancellingOrder = false;
        state.error = action.payload;
      })
      
      // Cancel order item
      .addCase(cancelOrderItem.pending, (state) => {
        state.cancellingItem = true;
        state.error = null;
      })
      .addCase(cancelOrderItem.fulfilled, (state, action) => {
        state.cancellingItem = false;
        state.order = action.payload.order;
        
        // Update the order in the orders array
        const index = state.orders.findIndex(
          (order) => order._id === action.payload.order._id
        );
        
        if (index !== -1) {
          state.orders[index] = action.payload.order;
        }
        
        state.success = true;
      })
      .addCase(cancelOrderItem.rejected, (state, action) => {
        state.cancellingItem = false;
        state.error = action.payload;
      })
      
      // Return order
      .addCase(returnOrder.pending, (state) => {
        state.returningOrder = true;
        state.error = null;
      })
      .addCase(returnOrder.fulfilled, (state, action) => {
        state.returningOrder = false;
        state.order = action.payload.order;
        
        // Update the order in the orders array
        const index = state.orders.findIndex(
          (order) => order._id === action.payload.order._id
        );
        
        if (index !== -1) {
          state.orders[index] = action.payload.order;
        }
        
        state.success = true;
      })
      .addCase(returnOrder.rejected, (state, action) => {
        state.returningOrder = false;
        state.error = action.payload;
      })
      
      // Return order item
      .addCase(returnOrderItem.pending, (state) => {
        state.returningItem = true;
        state.error = null;
      })
      .addCase(returnOrderItem.fulfilled, (state, action) => {
        state.returningItem = false;
        state.order = action.payload.order;
        
        // Update the order in the orders array
        const index = state.orders.findIndex(
          (order) => order._id === action.payload.order._id
        );
        
        if (index !== -1) {
          state.orders[index] = action.payload.order;
        }
        
        state.success = true;
      })
      .addCase(returnOrderItem.rejected, (state, action) => {
        state.returningItem = false;
        state.error = action.payload;
      })
      
      // Cancel unpaid pending order (no state change needed except maybe error)
      .addCase(cancelUnpaidPending.rejected, (state, action) => {
        state.error = action.payload;
      })
      
      // Mark payment failed
      .addCase(markPaymentFailed.rejected, (state, action) => {
        state.error = action.payload;
      })
      
      // Download invoice
      .addCase(downloadInvoice.pending, (state) => {
        state.downloadingInvoice = true;
        state.error = null;
      })
      .addCase(downloadInvoice.fulfilled, (state) => {
        state.downloadingInvoice = false;
        state.success = true;
      })
      .addCase(downloadInvoice.rejected, (state, action) => {
        state.downloadingInvoice = false;
        state.error = action.payload;
      });
  }
});

export const { resetOrderState, resetOrderCreated, clearOrderDetails } = orderSlice.actions;
export default orderSlice.reducer;
