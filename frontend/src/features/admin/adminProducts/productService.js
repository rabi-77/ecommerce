import api from "../../../apis/admin/api";

const getProducts = async ({ page, size, search }) => {
  const response = await api.get("/products", {
    params: { page, size, search },
  });
  return response.data;
};

const addProduct = async (productData) => {
    
  const response = await api.post("/add-product", productData, {
    headers:{"Content-Type":"multipart/form-data"},
  });
  return response.data;
};

const editProduct = async ({ id, productData }) => {
  const response = await api.put(`/edit-product/${id}`, productData,{
    headers:{"Content-Type":"multipart/form-data"}
  });
  return response.data;
};

const deleteProduct = async (id) => {
  await api.delete(`/delete-product/${id}`);
  return id;
};

const toggleListProduct = async (id) => {
  const response = await api.patch(`/products/${id}/list-product`);
  
  return response.data.product;
};

const toggleFeaturedProduct = async (id) => {
  const response = await api.patch(`/products/${id}/feature-product`);
  return response.data.product;
};

const getCategory = async () => {
  const response = await api.get("/get-categories");
  return response.data;
};

const getBrand = async () => {
  const response = await api.get("/get-brands");
  return response.data;
};

export {
  getProducts,
  editProduct,
  addProduct,
  deleteProduct,
  toggleFeaturedProduct,
  toggleListProduct,
  getBrand,
  getCategory,
};
