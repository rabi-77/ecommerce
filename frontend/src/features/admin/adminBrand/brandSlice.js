import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getBrands, addBrand, editBrand, deleteBrand, toggleBrandListing } from "./brandService";
// import { act } from "react";

export const getBrandsThunk = createAsyncThunk(
  "brand/getbrands",
  async ({ pages, sizes, search }, { rejectWithValue }) => {
    try {
      const response = await getBrands(pages, sizes, search);
      return response;
    } catch (err) {
      return rejectWithValue(
        err.response?.data.message || "failed fetching data"
      );
    }
  }
);

export const addBrandThunk = createAsyncThunk(
  "brand/addbrand",
  async (brandData, { rejectWithValue }) => {
    try {
      const response = await addBrand(brandData);
      return response;
    } catch (err) {
      return rejectWithValue(
        err.response?.data.message || " brand adding failed"
      );
    }
  }
);

export const editBrandThunk = createAsyncThunk(
  "brand/editbrand",
  async ({ id, brandData }, { rejectWithValue }) => {
    try {
      const response = await editBrand(id, brandData);
      return response;
    } catch (err) {
      return rejectWithValue(
        err.response?.data.message || "editing of brand failed"
      );
    }
  }
);

export const deleteBrandThunk = createAsyncThunk(
  "brand/deletebrand",
  async (id, { rejectWithValue }) => {
    try {
      const response = await deleteBrand(id);
      return id;
    } catch (err) {
      return rejectWithValue(
        err.response?.data.message ||
          "deletion of brand failed for some reason, please check it"
      );
    }
  }
);

export const toggleBrandListingThunk = createAsyncThunk(
  "brand/toggleListing",
  async (id, { rejectWithValue }) => {
    try {
      const response = await toggleBrandListing(id);
      return response.brand;
    } catch (err) {
      return rejectWithValue(
        err.response?.data.message || "Failed to toggle brand listing"
      );
    }
  }
);

const brandSlice = createSlice({
  name: "brand",
  initialState: {
    error: null,
    loading: false,
    brands: [],
    pages: 1,
    total: 0,
    sizes: 10,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getBrandsThunk.pending, (state) => {
        state.error = false;
        state.loading = true;
      })
      .addCase(getBrandsThunk.fulfilled, (state, action) => {
        state.error = null;
        state.loading = false;
        state.brands = action.payload.brands;
        state.pages = action.payload.page;
        state.sizes = action.payload.size;
        state.total = action.payload.total;
      })
      .addCase(getBrandsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    builder
      .addCase(addBrandThunk.pending, (state, action) => {
        state.loading = true;
        state.error = false;
      })
      .addCase(addBrandThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.brands = [ ...state.brands, action.payload.brand ];
        state.pages = action.payload.page;
        state.sizes = action.payload.size;
        state.total = action.payload.total;
      })
      .addCase(addBrandThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
    builder
      .addCase(editBrandThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(editBrandThunk.fulfilled, (state, action) => {
        state.error = null;
        state.loading = false;
        const index = state.brands.findIndex(
          (brand) => brand._id === action.payload.brand._id
        );
        if (index !== -1) {
          state.brands[index] = action.payload;
        }
      })
      .addCase(editBrandThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      builder
      .addCase(deleteBrandThunk.pending,(state,action)=>{
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteBrandThunk.fulfilled,(state,action)=>{
        state.error=null
        state.loading=false
        state.brands=state.brands.filter((brand)=>action.payload!==brand._id)
        state.total=-1
      })
      .addCase(deleteBrandThunk.rejected,(state,action)=>{
        state.loading=false
        state.error=action.payload || action.error
      })
      builder
      .addCase(toggleBrandListingThunk.pending, (state) => {
        state.loading = true;
        state.error = false;
      })
      .addCase(toggleBrandListingThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        // Update the brand in the state
        state.brands = state.brands.map(brand => 
          brand._id === action.payload._id ? action.payload : brand
        );
      })
      .addCase(toggleBrandListingThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
  },
});

export default brandSlice.reducer