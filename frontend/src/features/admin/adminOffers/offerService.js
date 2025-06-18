import api from '../../../apis/admin/api';

export const fetchOffers = async (params = {}) => {
  const response = await api.get('/offers', { params });
  return response.data;
};

export const removeOffer = async (id) => {
  const response = await api.delete(`/offers/${id}`);
  return response.data;
};

export const toggleOffer = async (id) => {
  const response = await api.patch(`/offers/${id}/toggle`);
  return response.data;
};

export const getOffer = async (id) => {
  const response = await api.get(`/offers/${id}`);
  return response.data;
};

export const createOffer = async (offerData) => {
  console.log(offerData,'df');
  
  const response = await api.post('/offers', offerData);
  return response.data;
};

export const updateOffer = async ({ id, ...offerData }) => {
  const response = await api.put(`/offers/${id}`, offerData);
  return response.data;
};
