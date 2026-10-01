import apiClient from './apiClient.js';

export const dashboardService = {
  getStats: () => apiClient.get('/dashboard/stats'),
};

export default dashboardService;
