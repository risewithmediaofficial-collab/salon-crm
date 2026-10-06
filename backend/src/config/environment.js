import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function requireEnv(key) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getEnv(key, defaultValue = '') {
  return process.env[key] || defaultValue;
}

export const env = {
  NODE_ENV: getEnv('NODE_ENV', 'development'),
  PORT: parseInt(getEnv('PORT', '5000'), 10),
  API_PREFIX: getEnv('API_PREFIX', '/api/v1'),

  MONGODB_URI: requireEnv('MONGODB_URI'),

  JWT_ACCESS_SECRET: requireEnv('JWT_ACCESS_SECRET'),
  JWT_REFRESH_SECRET: requireEnv('JWT_REFRESH_SECRET'),
  JWT_ACCESS_EXPIRES_IN: getEnv('JWT_ACCESS_EXPIRES_IN', '15m'),
  JWT_REFRESH_EXPIRES_IN: getEnv('JWT_REFRESH_EXPIRES_IN', '7d'),

  TWILIO_ACCOUNT_SID: getEnv('TWILIO_ACCOUNT_SID'),
  TWILIO_AUTH_TOKEN: getEnv('TWILIO_AUTH_TOKEN'),
  TWILIO_PHONE_NUMBER: getEnv('TWILIO_PHONE_NUMBER'),
  OTP_EXPIRY_MINUTES: parseInt(getEnv('OTP_EXPIRY_MINUTES', '10'), 10),
  OTP_MAX_ATTEMPTS: parseInt(getEnv('OTP_MAX_ATTEMPTS', '5'), 10),

  CORS_ALLOWED_ORIGINS: getEnv('CORS_ALLOWED_ORIGINS', 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim()),

  RATE_LIMIT_WINDOW_MS: parseInt(getEnv('RATE_LIMIT_WINDOW_MS', '900000'), 10),
  RATE_LIMIT_MAX: parseInt(getEnv('RATE_LIMIT_MAX', '5000'), 10),

  LOG_LEVEL: getEnv('LOG_LEVEL', 'info'),
  LOG_DIR: getEnv('LOG_DIR', 'logs'),

  SALON_NAME: getEnv('SALON_NAME', 'Salon'),
  SALON_TIMEZONE: getEnv('SALON_TIMEZONE', 'Asia/Kolkata'),

  isProduction: () => process.env.NODE_ENV === 'production',
  isDevelopment: () => process.env.NODE_ENV === 'development',
};

export default env;
