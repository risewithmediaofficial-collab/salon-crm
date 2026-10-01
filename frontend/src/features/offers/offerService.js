import apiClient from '../../services/apiClient.js';

export const offerService = {
  getAll: (params) => apiClient.get('/offers', { params }),
  getById: (id) => apiClient.get(`/offers/${id}`),
  create: (data) => apiClient.post('/offers', data),
  update: (id, data) => apiClient.patch(`/offers/${id}`, data),
  delete: (id) => apiClient.delete(`/offers/${id}`),
};

export default offerService;
