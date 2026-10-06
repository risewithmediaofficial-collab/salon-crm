import apiClient from '../../services/apiClient.js';

export const notificationService = {
  getAll: (params = { page: 1, limit: 15 }) =>
    apiClient.get('/notifications', { params }),

  markAsRead: (id) =>
    apiClient.patch(`/notifications/${id}/read`),

  markAllRead: () =>
    apiClient.patch('/notifications/read-all'),

  delete: (id) =>
    apiClient.delete(`/notifications/${id}`),

  clearAll: () =>
    apiClient.delete('/notifications/clear-all'),
};

export default notificationService;
