import { toast } from "react-toastify";
import {
  createRazorpayOrder,
  verifyPayment,
  gerRazorPayKey as fetchRazorPayKey,
} from "../razorpay/paymentService.js";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

export const razorpayOrderThunk = createAsyncThunk(
  "payment/createRazorpayOrder",
  async (orderData, { rejectWithValue }) => {
    try {
      const response = await createRazorpayOrder(orderData);
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to create Razorpay order";
      toast.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

export const verifyPaymentThunk = createAsyncThunk(
  "payment/verifyPayment",
  async (paymentData, { rejectWithValue }) => {
    try {
      const response = await verifyPayment(paymentData);
      toast.success("Payment verified successfully");
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to verify payment";
      toast.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

export const getRazorPayKeyThunk = createAsyncThunk(
  "payment/getRazorPayKey",
  async (_, { rejectWithValue, getState }) => {
    try {
      const { payment } = getState();
      // Return cached key if it exists
      if (payment.razorpayKey?.key) {
        return { key: payment.razorpayKey.key };
      }
      
      const response = await fetchRazorPayKey();
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to get payment configuration";
      return rejectWithValue(errorMessage);
    }
  }
);

const paymentSlice = createSlice({
  name: 'payment',
  initialState: {
    razorpayloading: false,
    razorpayerror: null,
    razorpayOrder: null,
    razorpayKey: null,
    verified: false,
    paymentStatus: 'idle', // 'idle' | 'processing' | 'succeeded' | 'failed'
  },
  reducers: {
    clearPaymentState: (state) => {
      state.razorpayloading = false;
      state.razorpayerror = null;
      state.razorpayOrder = null;
      state.razorpayKey = null;
      state.verified = false;
      state.paymentStatus = 'idle';
    },
    resetPaymentStatus: (state) => {
      state.paymentStatus = 'idle';
    }
  },
  extraReducers: (builder) => {
    // Razorpay Order
    builder
      .addCase(razorpayOrderThunk.pending, (state) => {
        state.razorpayloading = true;
        state.razorpayerror = null;
        state.paymentStatus = 'processing';
      })
      .addCase(razorpayOrderThunk.fulfilled, (state, action) => {
        state.razorpayloading = false;
        state.razorpayOrder = action.payload?.order || null;
        state.paymentStatus = 'succeeded';
      })
      .addCase(razorpayOrderThunk.rejected, (state, action) => {
        state.razorpayloading = false;
        state.razorpayerror = action.payload;
        state.paymentStatus = 'failed';
      });

    // Verify Payment
    builder
      .addCase(verifyPaymentThunk.pending, (state) => {
        state.razorpayloading = true;
        state.razorpayerror = null;
        state.paymentStatus = 'processing';
      })
      .addCase(verifyPaymentThunk.fulfilled, (state) => {
        state.razorpayloading = false;
        state.verified = true;
        state.paymentStatus = 'succeeded';
      })
      .addCase(verifyPaymentThunk.rejected, (state, action) => {
        state.razorpayloading = false;
        state.razorpayerror = action.payload;
        state.paymentStatus = 'failed';
      });

    // Get Razorpay Key
    builder
      .addCase(getRazorPayKeyThunk.pending, (state) => {
        state.razorpayloading = true;
        state.razorpayerror = null;
      })
      .addCase(getRazorPayKeyThunk.fulfilled, (state, action) => {
        state.razorpayloading = false;
        state.razorpayKey = action.payload;
      })
      .addCase(getRazorPayKeyThunk.rejected, (state, action) => {
        state.razorpayloading = false;
        state.razorpayerror = action.payload;
      });
  }
});

export const { clearPaymentState, resetPaymentStatus } = paymentSlice.actions;
export default paymentSlice.reducer;