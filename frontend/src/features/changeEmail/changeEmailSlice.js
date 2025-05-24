import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { verifyEmailChange, requestEmailChange } from "./changeEmailService";
import { toast } from "react-toastify";

export const requestEmailChangeThunk = createAsyncThunk(
  "changeEmail/request",
  async (emailData, { rejectWithValue }) => {
    try {
      const response = await requestEmailChange(emailData);
      toast.success(response.message || "Verification email sent");
      return response;
    } catch (error) {
      console.log(error.message,'why request failing');
      
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to request email change";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const verifyEmailChangeThunk = createAsyncThunk(
  "changeEmail/verify",
  async (token, { rejectWithValue }) => {
    try {
      return await verifyEmailChange(token);
    } catch (error) {
      console.log(error.message,'why verification failing');
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to verify email";
      return rejectWithValue(message);
    }
  }
);

const changeEmailSlice = createSlice({
  name: "changeEmail",
  initialState: {
    isLoading: false,
    isSuccess: false,
    isError: false,
    verificationSent: false,
    verificationStatus: null, // 'verifying', 'success', 'error'
    message: "",
  },
  reducers:{},
  extraReducers:(builder)=>{
    builder
      // Request email change
      .addCase(requestEmailChangeThunk.pending, (state) => {
        state.isLoading = true;
        state.isSuccess = false;
        state.isError = false;
        state.message = '';
      })
      .addCase(requestEmailChangeThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.verificationSent = true;
        state.message = action.payload.message || 'Verification email sent';
      })
      .addCase(requestEmailChangeThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      
      // Verify email change
      .addCase(verifyEmailChangeThunk.pending, (state) => {
        state.isLoading = true;
        state.verificationStatus = 'verifying';
        state.isSuccess = false;
        state.isError = false;
        state.message = '';
      })
      .addCase(verifyEmailChangeThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.verificationStatus = 'success';
        state.message = action.payload.message || 'Email verified successfully';
      })
      .addCase(verifyEmailChangeThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.verificationStatus = 'error';
        state.message = action.payload;
      });
  }
});

export default changeEmailSlice.reducer;
