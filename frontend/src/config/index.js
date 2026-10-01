export const config = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || '/api',
  SALON_NAME: import.meta.env.VITE_SALON_NAME || 'Glow & Glamour Salon',
  SALON_PHONE: import.meta.env.VITE_SALON_PHONE || '+91 98765 43210',
  SALON_ADDRESS: import.meta.env.VITE_SALON_ADDRESS || '104 Elegance Avenue, Indiranagar, Bengaluru',
  CURRENCY_SYMBOL: import.meta.env.VITE_CURRENCY_SYMBOL || '₹',
};

export default config;
