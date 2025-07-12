import api from "../../../apis/admin/api";

export const getBanners = async (page = 1, size = 10, search = "") => {
  const res = await api.get('/banners', { params: { page, size, search } });
  return res.data;
};

export const addBanner = async (formData) => {
  const res = await api.post('/banners', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.banner;
};

export const editBanner = async (id, formData) => {
  const res = await api.put(`/banners/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.banner;
};

export const deleteBanner = async (id) => {
  await api.delete(`/banners/${id}`);
  return id;
};
