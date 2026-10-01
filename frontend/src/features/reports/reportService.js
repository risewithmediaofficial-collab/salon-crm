import apiClient from '../../services/apiClient.js';

export const reportService = {
  getRevenue: (params) => apiClient.get('/reports/revenue', { params }),
  getStaffPerformance: (params) => apiClient.get('/reports/staff-performance', { params }),
  getTopServices: (params) => apiClient.get('/reports/top-services', { params }),
  getCustomerGrowth: (params) => apiClient.get('/reports/customer-growth', { params }),
};

export default reportService;
