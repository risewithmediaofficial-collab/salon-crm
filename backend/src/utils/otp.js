import crypto from 'crypto';

/**
 * Generate a cryptographically secure numeric OTP
 * @param {number} length - Number of digits (default 6)
 * @returns {string}
 */
export function generateOTP(length = 6) {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  const range = max - min + 1;
  const bytesNeeded = Math.ceil(Math.log2(range) / 8);
  let otp;
  do {
    const randomBytes = crypto.randomBytes(bytesNeeded);
    const randomInt = parseInt(randomBytes.toString('hex'), 16);
    otp = min + (randomInt % range);
  } while (otp < min || otp > max);
  return String(otp);
}

/**
 * Hash an OTP before storing in DB (SHA-256)
 * OTPs are short-lived and not passwords — SHA-256 is sufficient here.
 * @param {string} otp
 * @returns {string}
 */
export function hashOTP(otp) {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

/**
 * Verify an OTP against its stored hash
 * @param {string} otp - Plain OTP
 * @param {string} hash - Stored hash
 * @returns {boolean}
 */
export function verifyOTP(otp, hash) {
  if (!hash || !otp) return false;
  try {
    const otpHash = crypto.createHash('sha256').update(String(otp)).digest('hex');
    const a = Buffer.from(otpHash);
    const b = Buffer.from(hash);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Check if an OTP expiry timestamp is still valid
 * @param {Date} expiresAt
 * @returns {boolean}
 */
export function isOTPExpired(expiresAt) {
  return new Date() > new Date(expiresAt);
}
