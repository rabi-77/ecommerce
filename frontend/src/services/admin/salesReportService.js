import api from "../../apis/admin/api";

export const fetchSalesReport = async (params) => {
  const response = await api.get('/sales-report', { params });
  return response.data;
};

export const downloadSalesReport = async (params) => {
  // params should include format: 'pdf' | 'excel'
  const response = await api.get('/sales-report', {
    params,
    responseType: 'blob',
  });
  return response;
};
