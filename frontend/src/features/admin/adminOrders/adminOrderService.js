import api from '../../../apis/admin/api';

// Get all orders with pagination, search, and filters
export const getAllOrders = async ({ page = 1, size = 10, keyword = '', status = '', sort = 'newest' }) => {
  try {
    const response = await api.get('/orders', {
      params: { page, size, keyword, status, sort },
    });
    return response;
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
