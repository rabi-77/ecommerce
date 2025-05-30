import api from '../../../apis/admin/api';

// Get inventory with pagination, search, and sorting
export const getInventory = async (page = 1, size = 10, search = '', sort = 'name-asc') => {
  try {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('size', size);
    params.append('search', search);
    params.append('sort', sort);
    
    const response = await api.get(`/inventory?${params.toString()}`);
    return response;
  } catch (error) {
    throw error;
  }
};

// Update inventory for a product
export const updateInventory = async (productId, variants) => {
  try {
    const response = await api.put(`/inventory/${productId}`, { variants });
    return response;
  } catch (error) {
    throw error;
  }
};

// Get inventory history for a product
export const getInventoryHistory = async (productId) => {
  try {
    const response = await api.get(`/inventory/${productId}/history`);
    return response;
  } catch (error) {
    throw error;
  }
};

// Get low stock products
export const getLowStockProducts = async (threshold = 5) => {
  try {
    const response = await api.get(`/inventory/low-stock?threshold=${threshold}`);
    return response;
  } catch (error) {
    throw error;
  }
};
