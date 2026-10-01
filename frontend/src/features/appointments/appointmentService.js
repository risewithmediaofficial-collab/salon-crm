import apiClient from '../../services/apiClient.js';

export const appointmentService = {
  getSlots: ({ staffId, serviceId, date, slotInterval }) =>
    apiClient.get('/appointments/availability', {
      params: { staffId, serviceId, date, slotInterval },
    }),

  create: (bookingData) => apiClient.post('/appointments', bookingData),

  getAll: (params) => apiClient.get('/appointments', { params }),

  getById: (id) => apiClient.get(`/appointments/${id}`),

  updateStatus: (id, { status, reason }) =>
    apiClient.patch(`/appointments/${id}/status`, { status, reason }),

  cancel: (id, { reason }) => apiClient.post(`/appointments/${id}/cancel`, { reason }),

  submitReview: (id, { rating, comment }) =>
    apiClient.post(`/appointments/${id}/review`, { rating, comment }),
};

export default appointmentService;
