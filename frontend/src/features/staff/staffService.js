import apiClient from '../../services/apiClient.js';

export const staffService = {
  getAll: (params) => apiClient.get('/staff', { params }),
  getById: (id) => apiClient.get(`/staff/${id}`),
  create: (data) => apiClient.post('/staff', data),
  update: (id, data) => apiClient.patch(`/staff/${id}`, data),
  addLeave: (id, data) => apiClient.post(`/staff/${id}/leaves`, data),
  removeLeave: (id, leaveId) => apiClient.delete(`/staff/${id}/leaves/${leaveId}`),
  delete: (id) => apiClient.delete(`/staff/${id}`),
  getReviews: (id) => apiClient.get(`/staff/${id}/reviews`),
  submitReview: (id, data) => apiClient.post(`/staff/${id}/reviews`, data),
};

export default staffService;
