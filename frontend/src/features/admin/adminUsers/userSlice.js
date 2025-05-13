import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Thunks
export const fetchUsersThunk = createAsyncThunk(
  'adminUsers/fetchUsers',
  async ({ page = 1, size = 10, search = '' }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(
        `http://localhost:5000/admin/users?page=${page}&size=${size}&search=${search}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch users');
    }
  }
);

export const toggleUserBlockThunk = createAsyncThunk(
  'adminUsers/toggleUserBlock',
  async (userId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.patch(
        `http://localhost:5000/admin/toggle-user-block/${userId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return response.data;
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
  reducers: {
    setPage: (state, action) => {
      state.page = action.payload;
    },
    setSize: (state, action) => {
      state.size = action.payload;
    },
    setSearch: (state, action) => {
      state.search = action.payload;
    }
  },
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

export const { setPage, setSize, setSearch } = userSlice.actions;
export default userSlice.reducer;
