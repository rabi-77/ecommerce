import api from '../../../apis/admin/api';

// Get all orders with pagination, search, and filters
export const getAllOrders = async (page = 1, size = 10, search = '') => {
  try {
    const response = await api.get(`/orders?page=${page}&size=${size}&search=${search}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update order status
export const updateOrderStatus = async (orderId, status) => {
  try {
    const response = await api.patch(`/orders/${orderId}/status`, { status });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Verify return request
export const verifyReturnRequest = async (orderId, itemId, data) => {
  try {
    const response = await api.patch(`/orders/${orderId}/items/${itemId}/verify-return`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export default {
  getAllOrders,
  updateOrderStatus,
  verifyReturnRequest
};
