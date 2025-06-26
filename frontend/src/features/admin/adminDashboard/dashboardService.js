import api from "../../../apis/admin/api";

export const fetchDashboardStats = async (params) => {
  const response = await api.get('/dashboard-stats', { params });
  return response.data;
};

export const downloadLedgerPdf = async (params) => {
  const response = await api.get('/dashboard-stats', {
    params: { ...params, format: 'pdf' },
    responseType: 'blob',
  });
  return response;
};
