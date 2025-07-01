import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

import {
  getBrands,
  getCategories,
  getProductById,
  getProducts,
  getRelatedProducts,
} from "./userHomeService";

export const fetchProductsThunk = createAsyncThunk(
  "product/fetchProducts",
  async (params, { rejectWithValue }) => {
    try {
      const response = await getProducts(params);
      
      return response;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch products"
      );
    }
  }
);

export const fetchCategoriesThunk = createAsyncThunk(
  "product/fetchCategories",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getCategories();
      return response;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch categories"
      );
    }
  }
);

export const fetchBrandsThunk = createAsyncThunk(
  "product/fetchBrands",
  async (_, { rejectWithValue }) => {
    try {
      const response = await getBrands();
      return response;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch brands"
      );
    }
  }
);

export const fetchProductByIdThunk = createAsyncThunk(
  "product/fetchProductById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await getProductById(id);
      return response;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Product not found"
      );
    }
  }
);

export const fetchRelatedProductsThunk = createAsyncThunk(
  "product/fetchRelatedProducts",
  async (id, { rejectWithValue }) => {
    try {
      
      const response = await getRelatedProducts(id);
      return response;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch related products"
      );
    }
  }
);

const productSlice = createSlice({
  name: "product",
  initialState: {
    products: [],
    product: null,
    categories: [],
    brands: [],
    relatedProducts: [],
    totalPages: 1,
    currentPage: 1,
    totalProducts: 0,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProductsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.products;
        state.totalPages = action.payload.totalPages;
        state.currentPage = action.payload.currentPage;
        state.totalProducts = action.payload.totalProducts;
      })
      .addCase(fetchProductsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchCategoriesThunk.fulfilled, (state, action) => {
        state.categories = action.payload.categories;
      })
      .addCase(fetchBrandsThunk.fulfilled, (state, action) => {
        state.brands = action.payload.brands;
      })
      .addCase(fetchProductByIdThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.product = null;
      })
      .addCase(fetchProductByIdThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.product = action.payload;
      })
      .addCase(fetchProductByIdThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchRelatedProductsThunk.fulfilled, (state, action) => {
        state.relatedProducts = action.payload;
      });
  },
});

export default productSlice.reducer;
