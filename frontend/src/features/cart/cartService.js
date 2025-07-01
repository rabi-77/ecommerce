import api from '../../apis/user/api';

// ======================
// Coupon Related Functions
// ======================

export const validateCoupon = async (couponData) => {
  try {
    const response = await api.post('/coupons/validate', couponData);
    return response;
  } catch (error) {
    throw error;
  }
};

export const applyCouponToCart = async (couponCode) => {
  try {
    const response = await api.post('/cart/apply-coupon', { code: couponCode });
    return response;
  } catch (error) {
    throw error;
  }
};

export const removeCouponFromCart = async () => {
  try {
    const response = await api.delete('/cart/coupon');
    return response;
  } catch (error) {
    throw error;
  }
};

export const getAvailableCoupons = async () => {
  try {
    const response = await api.get('/coupons/active');
    return response;
  } catch (error) {
    throw error;
  }
};

// ======================
// Cart Item Functions
// ======================

// Get all cart items
export const getCartItems = async () => {
  try {
    const response = await api.get('/cart');
    return response;
  } catch (error) {
    throw error;
  }
};

// Add item to cart
export const addItemToCart = async (cartData) => {
  try {
    const response = await api.post('/cart', cartData);
    return response;
  } catch (error) {
    throw error;
  }
};

// Update cart item quantity
export const updateCartItemQuantity = async (cartItemId, quantity) => {
  try {
    const response = await api.put(`/cart/${cartItemId}`, { quantity });
    return response;
  } catch (error) {
    throw error;
  }
};

// Remove item from cart
export const removeItemFromCart = async (cartItemId) => {
  try {
    const response = await api.delete(`/cart/${cartItemId}`);
    return response;
  } catch (error) {
    throw error;
  }
};

// Clear entire cart
export const clearCartItems = async () => {
  try {
    const response = await api.delete('/cart/clear');
    return response;
  } catch (error) {
    throw error;
  }
};
