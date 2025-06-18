import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchWalletApi } from './walletService';

export const fetchWallet = createAsyncThunk('wallet/fetch', async (_, { rejectWithValue }) => {
  try {
    const { data } = await fetchWalletApi();
    return data.wallet;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

const walletSlice = createSlice({
  name: 'wallet',
  initialState: {
    balance: 0,
    transactions: [],
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
      })
      .addCase(fetchWallet.rejected, (state, action) => {
        state.loading = false; state.error = action.payload;
      });
  }
});

export default walletSlice.reducer;
