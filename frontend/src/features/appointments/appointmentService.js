import apiClient from '../../services/apiClient.js';

/**
 * Broadcast appointment state changes across tabs, windows, and components
 */
export function broadcastAppointmentEvent(type, data = null) {
  try {
    if (typeof window !== 'undefined') {
      // 1. Same-window custom event
      window.dispatchEvent(
        new CustomEvent('new-appointment-notification', {
          detail: { type, data, timestamp: Date.now() },
        })
      );

      // 2. Cross-tab BroadcastChannel
      if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel('salon_appointment_sync');
        channel.postMessage({ type, data, timestamp: Date.now() });
        channel.close();
      }

      // 3. LocalStorage storage event fallback (triggers in other tabs/windows)
      localStorage.setItem(
        'salon_last_booking_event',
        JSON.stringify({ type, data, timestamp: Date.now() })
      );
    }
  } catch (err) {
    // Ignore broadcast errors in restricted sandboxes
  }
}

export const appointmentService = {
  getSlots: ({ staffId, serviceId, serviceIds, date, slotInterval }) =>
    apiClient.get('/appointments/availability', {
      params: { staffId, serviceId, serviceIds, date, slotInterval },
    }),

  create: async (bookingData) => {
    const res = await apiClient.post('/appointments', bookingData);
    broadcastAppointmentEvent('APPOINTMENT_CREATED', res?.data);
    return res;
  },

  getAll: (params) => apiClient.get('/appointments', { params }),

  getById: (id) => apiClient.get(`/appointments/${id}`),

  updateStatus: async (id, { status, reason }) => {
    const res = await apiClient.patch(`/appointments/${id}/status`, { status, reason });
    broadcastAppointmentEvent('APPOINTMENT_STATUS_UPDATED', res?.data);
    return res;
  },

  cancel: async (id, { reason }) => {
    const res = await apiClient.post(`/appointments/${id}/cancel`, { reason });
    broadcastAppointmentEvent('APPOINTMENT_CANCELLED', res?.data);
    return res;
  },

  submitReview: (id, { rating, comment }) =>
    apiClient.post(`/appointments/${id}/review`, { rating, comment }),
};

export default appointmentService;
