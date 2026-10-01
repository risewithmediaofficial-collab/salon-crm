// Shared validation rules & regex patterns

export const PHONE_REGEX = /^[6-9]\d{9}$/; // Indian 10-digit mobile number
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/; // HH:mm 24-hr format
export const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD

export const VALIDATION_LIMITS = Object.freeze({
  NAME_MIN: 2,
  NAME_MAX: 100,
  PASSWORD_MIN: 8,
  SERVICE_NAME_MAX: 120,
  NOTES_MAX: 1000,
  MIN_PRICE: 0,
  MAX_PRICE: 1000000,
  MIN_DURATION: 5,
  MAX_DURATION: 480, // 8 hours max per service
});

export function isValidIndianPhone(phone) {
  if (!phone) return false;
  const clean = String(phone).replace(/\D/g, '');
  return PHONE_REGEX.test(clean.slice(-10));
}

export function isValidEmail(email) {
  if (!email) return false;
  return EMAIL_REGEX.test(String(email).trim().toLowerCase());
}

export function isValidTimeFormat(timeStr) {
  return TIME_REGEX.test(timeStr);
}

export function isValidDateFormat(dateStr) {
  return DATE_REGEX.test(dateStr);
}
