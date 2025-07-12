import api from "../../../apis/admin/api";

// Fetch banners with pagination & search
export const getBanners = async (page = 1, size = 10, search = "") => {
  const res = await api.get('/banners', { params: { page, size, search } });
  return res.data;
};

// Create banner (multipart/form-data)
export const addBanner = async (formData) => {
  const res = await api.post('/banners', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.banner;
};

// Update banner
export const editBanner = async (id, formData) => {
  const res = await api.put(`/banners/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.banner;
};

// Delete banner
export const deleteBanner = async (id) => {
  await api.delete(`/banners/${id}`);
  return id;
};
