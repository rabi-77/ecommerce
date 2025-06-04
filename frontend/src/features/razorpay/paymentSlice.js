import { toast } from "react-toastify";
import {
  createRazorpayOrder,
  verifyPayment,
  gerRazorPayKey,
} from "../razorpay/paymentService.js";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

export const razorpayOrderThunk = createAsyncThunk(
  "payment/createRazorpayOrder",
  async (orderData, { rejectWithValue }) => {
    try {
      const response = await createRazorpayOrder(orderData);
      //  toast.success('Order created successfully')
      return response;
    } catch (error) {
      toast.error(error.response?.data?.message || "failed to create order");
      return rejectWithValue(
        error.response?.data?.message || "failed to create order"
      );
    }
  }
);

export const verifyPaymentThunk = createAsyncThunk(
  "payment/verifypayment",
  async (paymentData, { rejectWithValue }) => {
    try {
      const response = await verifyPayment(paymentData);
      toast.success("Payment verified successfully");
      return response;
    } catch (error) {
      toast.error(error.response?.data?.message || "failed to verify payment");
      return rejectWithValue(
        error.response?.data?.message || "failed to verify payment"
      );
    }
  }
);

export const getRazorPayKeyThunk = createAsyncThunk(
  "payment/getRazorPayKey",
  async (_, { rejectWithValue }) => {
    try {
      const response = await gerRazorPayKey();
      return response;
    } catch (error) {
      toast.error(
        error.response?.data?.message || "failed to get payment configuration"
      );
      return rejectWithValue(
        error.response?.data?.message || "failed to get payment configuration"
      );
    }
  }
);

const paymentSlice = createSlice({

    name:'payment',
    initialState:{
        razorpayloading:false,
        razorpayerror:null,
        razorpayOrder:{},
        razorpayKey:{},
        verified:false
    },
    reducers:{
     clearPaymentState:(state)=>{
        state.razorpayloading=false
        state.razorpayerror=null
        state.razorpayOrder={}
        state.razorpayKey={}
        state.verified=false
    }
},extraReducers:(builder)=>{
    builder
    .addCase(razorpayOrderThunk.pending,(state)=>{
        state.razorpayloading=true
        state.razorpayerror=null
    })
    .addCase(razorpayOrderThunk.fulfilled,(state,action)=>{
        state.razorpayloading=false
        state.razorpayerror=null
        state.razorpayOrder=action.payload.order
    })
    .addCase(razorpayOrderThunk.rejected,(state,action)=>{
        state.razorpayloading=false
        state.razorpayerror=action.payload
    });

    builder.addCase(verifyPaymentThunk.pending,(state)=>{
        state.razorpayloading=true
        state.razorpayerror=null
    })
    .addCase(verifyPaymentThunk.fulfilled,(state,action)=>{
        state.razorpayloading=false
        state.razorpayerror=false
        state.verified=true
    }).addCase(verifyPaymentThunk.rejected,(state,action)=>{
        state.razorpayloading=false
        state.razorpayerror=action.payload
        state.verified=false
    })
    builder.addCase(getRazorPayKeyThunk.pending,(state)=>{
        state.razorpayloading=true
        state.razorpayerror=null
    })
    .addCase(getRazorPayKeyThunk.fulfilled,(state,action)=>{
        state.razorpayloading=false
        state.razorpayerror=null
        state.razorpayKey=action.payload.key
    })
    .addCase(getRazorPayKeyThunk.rejected,(state,action)=>{
        state.razorpayloading=false
        state.razorpayerror=action.payload
    })
}


});

export default paymentSlice.reducer
export const {clearPaymentState}=paymentSlice.actions