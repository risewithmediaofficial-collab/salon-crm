import apiClient from '../../services/apiClient.js';

export const serviceService = {
  getAll: (params) => apiClient.get('/services', { params }),
  getCategories: () => apiClient.get('/services/categories'),
  getById: (id) => apiClient.get(`/services/${id}`),
  create: (data) => apiClient.post('/services', data),
  update: (id, data) => apiClient.patch(`/services/${id}`, data),
  delete: (id) => apiClient.delete(`/services/${id}`),
};

export default serviceService;
