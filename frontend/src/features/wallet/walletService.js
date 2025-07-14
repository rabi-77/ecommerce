import api from '../../apis/user/api';

// Fetch wallet details (balance & transactions)
export const fetchWalletApi = async (page = 1, limit = 10) => {
  try {
    const response = await api.get(`/wallet?page=${page}&limit=${limit}`);
    return response;
  } catch (error) {
    throw error;
  }
};
