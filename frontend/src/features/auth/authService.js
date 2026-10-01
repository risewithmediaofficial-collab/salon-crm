import apiClient from '../../services/apiClient.js';

export const authService = {
  sendCustomerOtp: (phone, name) => apiClient.post('/auth/customer/send-otp', { phone, name }),
  verifyCustomerOtp: (phone, otp) => apiClient.post('/auth/customer/verify-otp', { phone, otp }),
  staffLogin: (email, password) => apiClient.post('/auth/staff/login', { email, password }),
  logout: () => apiClient.post('/auth/logout'),
  getMe: () => apiClient.get('/auth/me'),
};

export default authService;
