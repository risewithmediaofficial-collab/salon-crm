import apiClient from '../../services/apiClient.js';

export const billingService = {
  getAll: (params) => apiClient.get('/billing', { params }),
  getById: (id) => apiClient.get(`/billing/${id}`),
  recordPayment: (id, paymentData) => apiClient.post(`/billing/${id}/pay`, paymentData),
  issueInvoice: (id) => apiClient.post(`/billing/${id}/issue`),
  validateOffer: (code, serviceId) => apiClient.post('/billing/validate-offer', { code, serviceId }),
};

export default billingService;
