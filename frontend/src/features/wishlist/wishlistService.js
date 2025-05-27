import api from '../../apis/user/api';

// Get all wishlist items
export const getWishlistItems = async () => {
  try {
    const response = await api.get('/wishlist');
    return response;
  } catch (error) {
    throw error;
  }
};

// Add item to wishlist
export const addItemToWishlist = async (productId) => {
  try {
    const response = await api.post('/wishlist', { productId });
    return response;
  } catch (error) {
    throw error;
  }
};

// Remove item from wishlist
export const removeItemFromWishlist = async (productId) => {
  try {
    const response = await api.delete(`/wishlist/${productId}`);
    return response;
  } catch (error) {
    throw error;
  }
};

// Clear entire wishlist
export const clearWishlistItems = async () => {
  try {
    const response = await api.delete('/wishlist');
    return response;
  } catch (error) {
    throw error;
  }
};

// Check if product is in wishlist
export const checkWishlistItemStatus = async (productId) => {
  try {
    const response = await api.get(`/wishlist/check/${productId}`);
    return response;
  } catch (error) {
    throw error;
  }
};
