import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getUsers, toggleUserBlock } from './userService';

// Thunks
export const fetchUsersThunk = createAsyncThunk(
  'adminUsers/fetchUsers',
  async ({ page = 1, size = 10, search = '' }, { rejectWithValue }) => {
    try {
      return await getUsers(page, size, search);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch users');
    }
  }
);

export const toggleUserBlockThunk = createAsyncThunk(
  'adminUsers/toggleUserBlock',
  async (userId, { rejectWithValue }) => {
    try {
      return await toggleUserBlock(userId);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to toggle user block status');
    }
  }
);

// Slice
const userSlice = createSlice({
  name: 'adminUsers',
  initialState: {
    users: [],
    total: 0,
    page: 1,
    size: 10,
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch users
      .addCase(fetchUsersThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsersThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload.users;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.size = action.payload.size;
      })
      .addCase(fetchUsersThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Toggle user block status
      .addCase(toggleUserBlockThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleUserBlockThunk.fulfilled, (state, action) => {
        state.loading = false;
        // Update the user in the state
        const updatedUser = action.payload.user;
        const index = state.users.findIndex(user => user._id === updatedUser._id);
        if (index !== -1) {
          state.users[index] = updatedUser;
        }
      })
      .addCase(toggleUserBlockThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export default userSlice.reducer;
