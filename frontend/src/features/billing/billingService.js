import apiClient from '../../services/apiClient.js';
import { broadcastAppointmentEvent } from '../appointments/appointmentService.js';

export const billingService = {
  getAll: (params) => apiClient.get('/billing', { params }),
  getById: (id) => apiClient.get(`/billing/${id}`),
  recordPayment: async (id, paymentData) => {
    const res = await apiClient.post(`/billing/${id}/pay`, paymentData);
    broadcastAppointmentEvent('BILLING_UPDATED', res?.data);
    return res;
  },
  issueInvoice: (id) => apiClient.post(`/billing/${id}/issue`),
  validateOffer: (code, serviceId) => apiClient.post('/billing/validate-offer', { code, serviceId }),
  createPosSale: async (posData) => {
    const res = await apiClient.post('/billing/pos', posData);
    broadcastAppointmentEvent('BILLING_UPDATED', res?.data);
    return res;
  },
};

export default billingService;
