// import api from '../../apis/user/api';
import axios from 'axios';
import { API_URL } from '../../config';

const api = axios.create({
  baseURL: `${API_URL}`,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("tokenAccess");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Create new order
export const createOrder = async (orderData) => {
  try {
    const response = await api.post('/orders', orderData);
    return response;
  } catch (error) {
    throw error;
  }
};

// Get order details by ID or order number
export const getOrderDetails = async (orderId) => {
  try {
    const response = await api.get(`/orders/${orderId}`);
    return response;
  } catch (error) {
    throw error;
  }
};

// Get all user orders with optional search and filter
export const getMyOrders = async (keyword = '', status = '') => {
  try {
    console.log('lol');
    
    const response = await api.get(`/orders?keyword=${keyword}&status=${status}`);
    return response;
  } catch (error) {
    console.log('er',error.message);
    
    throw error;
  }
};

// Cancel entire order
export const cancelOrder = async (orderId, reason) => {
  try {
    const response = await api.put(`/orders/${orderId}/cancel`, { reason });
    return response;
  } catch (error) {
    throw error;
  }
};

// Cancel specific item in order
export const cancelOrderItem = async (orderId, itemId, reason) => {
  try {
    const response = await api.put(`/orders/${orderId}/items/${itemId}/cancel`, { reason });
    return response;
  } catch (error) {
    throw error;
  }
};

// Return entire order
export const returnOrder = async (orderId, reason) => {
  try {
    const response = await api.put(`/orders/${orderId}/return`, { reason });
    return response;
  } catch (error) {
    throw error;
  }
};

// Return specific item in order
export const returnOrderItem = async (orderId, itemId, reason) => {
  try {
    const response = await api.put(`/orders/${orderId}/items/${itemId}/return`, { reason });
    return response;
  } catch (error) {
    throw error;
  }
};

// Generate and download invoice
export const downloadInvoice = async (orderId) => {
  try {
    // This needs to be handled differently since it returns a PDF file
    const response = await api.get(`/orders/${orderId}/invoice`, {
      responseType: 'blob' // Important for handling PDF files
    });
    
    // Create a URL for the blob
    const url = window.URL.createObjectURL(new Blob([response.data]));
    
    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `invoice-${orderId}.pdf`);
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    window.URL.revokeObjectURL(url);
    document.body.removeChild(link);
    
    return { success: true };
  } catch (error) {
    throw error;
  }
};

const orderService = {
  createOrder,
  getOrderDetails,
  getMyOrders,
  cancelOrder,
  cancelOrderItem,
  returnOrder,
  returnOrderItem,
  downloadInvoice
};

export default orderService;
