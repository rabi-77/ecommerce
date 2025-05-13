import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getProducts,
  addProduct,
  editProduct,
  deleteProduct,
  toggleListProduct,
  toggleFeaturedProduct,
  getBrand,
  getCategory,
} from "./productService";

export const getProductsThunk = createAsyncThunk(
  "product/getProducts",
  async ({ page, size, search }, { rejectWithValue }) => {
    try {
      const data = await getProducts({ page, size, search });
      console.log(data);
      
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch products");
    }
  }
);

export const addProductThunk = createAsyncThunk(
  "product/addProduct",
  async (productData, { rejectWithValue }) => {
    try {
      const data = await addProduct(productData);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to add product");
    }
  }
);

export const editProductThunk = createAsyncThunk(
  "product/editProduct",
  async ({ id, productData }, { rejectWithValue }) => {
    try {
      const data = await editProduct({ id, productData });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to update product");
    }
  }
);

export const deleteProductThunk = createAsyncThunk(
  "product/deleteProduct",
  async (id, { rejectWithValue }) => {
    try {
      const deletedId = await deleteProduct(id);
      return deletedId;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to delete product");
    }
  }
);

export const toggleListProductThunk = createAsyncThunk(
  "product/toggleListProduct",
  async (id, { rejectWithValue }) => {
    try {
        console.log('what happened');
        
      const updatedProduct = await toggleListProduct(id);
      
      return updatedProduct;
    } catch (err) {
        console.log(err.message);
        
      return rejectWithValue(err.response?.data?.message || "Failed to toggle listing status");
    }
  }
);

export const toggleFeaturedProductThunk = createAsyncThunk(
  "product/toggleFeaturedProduct",
  async (id, { rejectWithValue }) => {
    try {
      const updatedProduct = await toggleFeaturedProduct(id);
      return updatedProduct;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to toggle featured status");
    }
  }
);

export const categoryThunk = createAsyncThunk(
    "product/category",
    async (_, { rejectWithValue }) => {
      try {
        const data = await getCategory();
        return data;
      } catch (err) {
        return rejectWithValue(err.response?.data?.message || "Failed to fetch category");
      }
    }
  );
export const brandThunk = createAsyncThunk(
    "product/brand",
    async (_, { rejectWithValue }) => {
      try {
        const data = await getBrand();
        return data;
      } catch (err) {
        return rejectWithValue(err.response?.data?.message || "Failed to fetch brand");
      }
    }
  );
const productSlice = createSlice({
  name: "product",
  initialState: {
    products: [],
    total: 0,
    page: 1,
    size: 10,
    loading: false,
    error: null,
    categories:[],
    brands:[]
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getProductsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getProductsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.products;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.size = action.payload.size;
      })
      .addCase(getProductsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addProductThunk.fulfilled, (state, action) => {
        state.products.unshift(action.payload.product);
        state.total += 1;
      })
      .addCase(addProductThunk.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(editProductThunk.fulfilled, (state, action) => {
        const index = state.products.findIndex((p) => p._id === action.payload.product._id);
        if (index !== -1) {
          state.products[index] = action.payload.product;
        }
      })
      .addCase(editProductThunk.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(deleteProductThunk.fulfilled, (state, action) => {
        state.products = state.products.filter((p) => p._id !== action.payload);
        state.total -= 1;
      })
      .addCase(deleteProductThunk.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(toggleListProductThunk.fulfilled, (state, action) => {
        const index = state.products.findIndex((p) => p._id === action.payload._id);
        if (index !== -1) {
          state.products[index] = action.payload;
        }
      })
      .addCase(toggleListProductThunk.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(toggleFeaturedProductThunk.fulfilled, (state, action) => {
        const index = state.products.findIndex((p) => p._id === action.payload._id);
        if (index !== -1) {
          state.products[index] = action.payload;
        }
      })
      .addCase(toggleFeaturedProductThunk.rejected, (state, action) => {
        state.error = action.payload;
      })

      builder
      .addCase(categoryThunk.fulfilled,(state,action)=>{
        state.categories=action.payload.categories
      })
      .addCase(brandThunk.fulfilled,(state,action)=>{
        state.brands=action.payload.brands
      })
  },
});

export default productSlice.reducer;