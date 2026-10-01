import apiClient from '../../services/apiClient.js';

export const customerService = {
  getAll: (params) => apiClient.get('/customers', { params }),
  getById: (id) => apiClient.get(`/customers/${id}`),
  getProfile: () => apiClient.get('/customers/profile'),
  update: (id, data) => apiClient.patch(`/customers/${id}`, data),
  createAdmin: (data) => apiClient.post('/customers', data),
};

export default customerService;
