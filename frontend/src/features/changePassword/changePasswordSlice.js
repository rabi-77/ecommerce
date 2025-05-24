import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { changePasswordRequest } from './changePasswordService';

// Change password thunk
export const changePassword = createAsyncThunk(
  'changePassword/change',
  async (passwordData, { rejectWithValue }) => {
    try {
      const response = await changePasswordRequest(passwordData);
      return response;
    } catch (error) {
      if (error.field) {
        // If we have a field-specific error
        return rejectWithValue({
          message: error.message,
          field: error.field
        });
      }
      return rejectWithValue(error.message || 'Failed to change password');
    }
  }
);

// Initial state
const initialState = {
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: '',
  fieldError: null
};

// Create slice
const changePasswordSlice = createSlice({
  name: 'changePassword',
  initialState,
  reducers: {
    resetChangePassword: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
      state.fieldError = null;
    },
    clearChangePasswordErrors: (state) => {
      state.isError = false;
      state.message = '';
      state.fieldError = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(changePassword.pending, (state) => {
        state.isLoading = true;
        state.isSuccess = false;
        state.isError = false;
        state.message = '';
        state.fieldError = null;
      })
      .addCase(changePassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.message = action.payload.message || 'Password changed successfully';
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        
        // Handle field-specific errors
        if (action.payload && typeof action.payload === 'object') {
          state.message = action.payload.message;
          state.fieldError = action.payload.field;
        } else {
          state.message = action.payload || 'Failed to change password';
        }
      });
  }
});

export const { resetChangePassword, clearChangePasswordErrors } = changePasswordSlice.actions;
export default changePasswordSlice.reducer;
