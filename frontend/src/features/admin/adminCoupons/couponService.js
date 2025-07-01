import api from '../../../apis/admin/api';

export const getCoupons = async (params = {}) => {
  const response = await api.get('/coupons', { params });
  return response.data;
};

export const getCoupon = async (id) => {
  const response = await api.get(`/coupons/${id}`);
  return response.data;
};

export const createCoupon = async (couponData) => {
  
  const response = await api.post('/coupons', couponData);
  return response.data;
};

export const updateCoupon = async ({ id, ...couponData }) => {
  const response = await api.put(`/coupons/${id}`, couponData);
  return response.data;
};

export const deleteCoupon = async (id) => {
  const response = await api.delete(`/coupons/${id}`);
  return response.data;
};

export const toggleCouponStatus = async (id) => {
  const response = await api.patch(`/coupons/${id}/toggle`);
  return response.data;
};

export const validateCoupon = async (code, amount) => {
  const response = await api.post('/coupons/validate', { code, amount });
  return response.data;
};
