import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchWalletApi } from './walletService';

// Thunk now accepts {page,limit}
export const fetchWallet = createAsyncThunk('wallet/fetch', async ({ page = 1, limit = 10 } = {}, { rejectWithValue }) => {
  try {
    const { data } = await fetchWalletApi(page, limit);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

const walletSlice = createSlice({
  name: 'wallet',
  initialState: {
    balance: 0,
    transactions: [],
    currentPage: 1,
    totalPages: 1,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchWallet.pending, (state) => {
        state.loading = true; state.error = null;
      })
      .addCase(fetchWallet.fulfilled, (state, action) => {
        state.loading = false;
        state.balance = action.payload.balance;
        state.transactions = action.payload.transactions;
        state.currentPage = action.payload.currentPage;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchWallet.rejected, (state, action) => {
        state.loading = false; state.error = action.payload;
      });
  }
});

export default walletSlice.reducer;
