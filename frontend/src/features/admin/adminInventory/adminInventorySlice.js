import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as adminInventoryService from './adminInventoryService';

const initialState = {
  inventory: [],
  total: 0,
  page: 1,
  size: 10,
  totalPages: 0,
  loading: false,
  error: null,
  success: false,
  updating: false,
  updateSuccess: false,
  history: [],
  historyLoading: false,
  lowStockProducts: [],
  lowStockLoading: false
};

// Get inventory with pagination, search, and sorting
export const getInventory = createAsyncThunk(
  'adminInventory/getAll',
  async ({ page = 1, size = 10, search = '', sort = 'name-asc' }, thunkAPI) => {
    try {
      const response = await adminInventoryService.getInventory(page, size, search, sort);
      return response.data;
    } catch (error) {
      const message = 
        (error.response && 
          error.response.data && 
          error.response.data.message) ||
        error.message ||
        error.toString();
      
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Update inventory for a product
export const updateInventory = createAsyncThunk(
  'adminInventory/update',
  async ({ productId, variants }, thunkAPI) => {
    try {
      const response = await adminInventoryService.updateInventory(productId, variants);
      return response.data;
    } catch (error) {
      const message = 
        (error.response && 
          error.response.data && 
          error.response.data.message) ||
        error.message ||
        error.toString();
      
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get inventory history for a product
export const getInventoryHistory = createAsyncThunk(
  'adminInventory/getHistory',
  async (productId, thunkAPI) => {
    try {
      const response = await adminInventoryService.getInventoryHistory(productId);
      return response.data;
    } catch (error) {
      const message = 
        (error.response && 
          error.response.data && 
          error.response.data.message) ||
        error.message ||
        error.toString();
      
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get low stock products
export const getLowStockProducts = createAsyncThunk(
  'adminInventory/getLowStock',
  async (threshold = 5, thunkAPI) => {
    try {
      const response = await adminInventoryService.getLowStockProducts(threshold);
      return response.data;
    } catch (error) {
      const message = 
        (error.response && 
          error.response.data && 
          error.response.data.message) ||
        error.message ||
        error.toString();
      
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const adminInventorySlice = createSlice({
  name: 'adminInventory',
  initialState,
  reducers: {
    resetInventoryState: (state) => {
      state.success = false;
      state.error = null;
      state.updateSuccess = false;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Get inventory
      .addCase(getInventory.pending, (state) => {
        state.loading = true;
      })
      .addCase(getInventory.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.inventory = action.payload.products || [];
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.size = action.payload.size;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(getInventory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update inventory
      .addCase(updateInventory.pending, (state) => {
        state.updating = true;
      })
      .addCase(updateInventory.fulfilled, (state, action) => {
        state.updating = false;
        state.updateSuccess = true;
        
        // Update the product in the inventory state
        const updatedProduct = action.payload.product;
        state.inventory = state.inventory.map(product => 
          product._id === updatedProduct._id ? updatedProduct : product
        );
      })
      .addCase(updateInventory.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload;
      })
      
      // Get inventory history
      .addCase(getInventoryHistory.pending, (state) => {
        state.historyLoading = true;
      })
      .addCase(getInventoryHistory.fulfilled, (state, action) => {
        state.historyLoading = false;
        state.history = action.payload.inventoryChanges || [];
        state.selectedProduct = action.payload.product;
      })
      .addCase(getInventoryHistory.rejected, (state, action) => {
        state.historyLoading = false;
        state.error = action.payload;
      })
      
      // Get low stock products
      .addCase(getLowStockProducts.pending, (state) => {
        state.lowStockLoading = true;
      })
      .addCase(getLowStockProducts.fulfilled, (state, action) => {
        state.lowStockLoading = false;
        state.lowStockProducts = action.payload.products || [];
      })
      .addCase(getLowStockProducts.rejected, (state, action) => {
        state.lowStockLoading = false;
        state.error = action.payload;
      });
  }
});

export const { resetInventoryState, clearError } = adminInventorySlice.actions;
export default adminInventorySlice.reducer;
