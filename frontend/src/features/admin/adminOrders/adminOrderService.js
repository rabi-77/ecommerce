import api from '../../../apis/admin/api';

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

export const updateOrderStatus = async (orderId, status) => {
  try {
    const response = await api.patch(`/orders/${orderId}/status`, { status });
    return response.data;
  } catch (error) {
    throw error;
  }
};

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
