import axios from 'axios';
import config from '../config/index.js';

const apiClient = axios.create({
  baseURL: config.API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Determine active token depending on whether request is made in admin/staff or customer context
 */
export function getActiveToken(isExplicitAdmin) {
  const isAdmin =
    typeof isExplicitAdmin === 'boolean'
      ? isExplicitAdmin
      : typeof window !== 'undefined' &&
        (window.location.pathname.startsWith('/admin') ||
          window.location.pathname.startsWith('/staff-login'));

  const adminToken = localStorage.getItem('adminAccessToken');
  const customerToken = localStorage.getItem('customerAccessToken');
  const genericToken = localStorage.getItem('accessToken');

  if (isAdmin) {
    return adminToken || genericToken || customerToken;
  }
  return customerToken || genericToken || adminToken;
}

// Request interceptor: attach token
apiClient.interceptors.request.use(
  (reqConfig) => {
    const isAdminUrl =
      typeof window !== 'undefined' &&
      (window.location.pathname.startsWith('/admin') ||
        reqConfig.url?.includes('/appointments') ||
        reqConfig.url?.includes('/staff') ||
        reqConfig.url?.includes('/customers') ||
        reqConfig.url?.includes('/billing') ||
        reqConfig.url?.includes('/reports') ||
        reqConfig.url?.includes('/audit'));

    const token = getActiveToken(isAdminUrl);
    if (token) {
      reqConfig.headers.Authorization = `Bearer ${token}`;
    }
    return reqConfig;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: auto token refresh & safe error unwrapping
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized for token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      const isAdminContext =
        typeof window !== 'undefined' &&
        (window.location.pathname.startsWith('/admin') ||
          originalRequest.url?.includes('/staff') ||
          originalRequest.url?.includes('/billing') ||
          originalRequest.url?.includes('/reports') ||
          originalRequest.url?.includes('/audit'));

      const refreshToken = isAdminContext
        ? (localStorage.getItem('adminRefreshToken') || localStorage.getItem('refreshToken'))
        : (localStorage.getItem('customerRefreshToken') || localStorage.getItem('refreshToken'));

      const isCustomer = !isAdminContext && Boolean(localStorage.getItem('customerRefreshToken'));

      if (!refreshToken) {
        if (isAdminContext) {
          localStorage.removeItem('adminAccessToken');
          localStorage.removeItem('adminRefreshToken');
        } else {
          localStorage.removeItem('customerAccessToken');
          localStorage.removeItem('customerRefreshToken');
        }
        return Promise.reject(error.response?.data || error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await axios.post(`${config.API_BASE_URL}/auth/refresh-token`, {
          refreshToken,
          isCustomer,
        });

        const newAccessToken = res.data.data.accessToken;
        const newRefreshToken = res.data.data.refreshToken;

        if (isAdminContext) {
          localStorage.setItem('adminAccessToken', newAccessToken);
          if (newRefreshToken) localStorage.setItem('adminRefreshToken', newRefreshToken);
        } else {
          localStorage.setItem('customerAccessToken', newAccessToken);
          if (newRefreshToken) localStorage.setItem('customerRefreshToken', newRefreshToken);
        }
        localStorage.setItem('accessToken', newAccessToken);

        apiClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        if (isAdminContext) {
          localStorage.removeItem('adminAccessToken');
          localStorage.removeItem('adminRefreshToken');
        } else {
          localStorage.removeItem('customerAccessToken');
          localStorage.removeItem('customerRefreshToken');
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    const errorPayload = error.response?.data || {
      success: false,
      message: error.message || 'Network error occurred',
      code: 'NETWORK_ERROR',
    };

    return Promise.reject(errorPayload);
  }
);

export default apiClient;
