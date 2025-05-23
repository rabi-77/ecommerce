import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getUserProfile, updateUserProfile } from "./profileServices";

export const fetchUserProfile = createAsyncThunk(
  "profile/fetchProfile",
  async (id, { rejectWithValue }) => {
    try {
      const data = await getUserProfile(id);
      console.log(data.user.username,'slice');
      
      return data.user;
    } catch (err) {
      return rejectWithValue(err.message || "Failed to fetch profile");
    }
  }
);

export const updateProfile = createAsyncThunk(
  "profile/updateProfile",
  async (profileData, { rejectWithValue }) => {
    try {
      console.log(profileData,'frony');
      
      const data = await updateUserProfile(profileData);
      return data;
    } catch (err) {
      return rejectWithValue(err.message || "Failed to update profile");
    }
  }
);

const initialState = {
  profileData: null,
  loading: false,
  success: false,
  error: false,
  errorMessage: null,
};

const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    clearProfileErrors: (state) => {
      state.error = false;
      state.errorMessage = null;
    },
    resetProfileState: (state) => {
      state.profileData = null;
      state.loading = false;
      state.success = false;
      state.error = false;
      state.errorMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = false;
        state.errorMessage = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profileData = action.payload;
        state.success = true;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = true;
        state.errorMessage = action.payload;
      });

    builder
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = false;
        state.errorMessage = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profileData = action.payload.user;
        state.success = true;
        
        // Also update the user in localStorage if needed
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          const updatedUser = { ...user, ...action.payload.user };
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = true;
        state.errorMessage = action.payload;
      });
  },
});

export const { clearProfileErrors, resetProfileState } = profileSlice.actions;
export default profileSlice.reducer;
