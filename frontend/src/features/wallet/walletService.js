import api from '../../apis/user/api';

// Fetch wallet details (balance & transactions)
export const fetchWalletApi = async () => {
  try {
    const response = await api.get('/wallet');
    return response;
  } catch (error) {
    throw error;
  }
};
