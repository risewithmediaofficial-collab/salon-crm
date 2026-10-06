import rateLimit from 'express-rate-limit';
import env from '../config/environment.js';
import { errorResponse } from '../utils/apiResponse.js';

const rateLimitHandler = (_req, res) => {
  return errorResponse(res, {
    statusCode: 429,
    message: 'Too many requests. Please slow down and try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
  });
};

/**
 * General API rate limiter
 */
export const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

/**
 * Strict limiter for auth endpoints (OTP, login)
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Relaxed from 10 to 30 to avoid locking out staff during shifts
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skipSuccessfulRequests: true, // Successful logins never count against the rate limit
});

/**
 * OTP send limiter — max 3 OTPs per phone per window
 */
export const otpSendLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  keyGenerator: (req) => req.body?.phone || req.ip,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});
