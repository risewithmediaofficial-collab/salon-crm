import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import env from '../config/environment.js';

/**
 * Generate a signed access token (short-lived)
 */
export function generateAccessToken(payload) {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    issuer: 'salon-crm',
  });
}

/**
 * Generate a signed refresh token (long-lived)
 */
export function generateRefreshToken(payload) {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    issuer: 'salon-crm',
  });
}

/**
 * Verify a refresh token
 */
export function verifyRefreshToken(token) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET);
}

/**
 * Hash a refresh token for secure storage (SHA-256)
 */
export function hashRefreshToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generate both tokens for a user/customer
 * @param {{ id: string, role: string }} actor
 * @returns {{ accessToken: string, refreshToken: string }}
 */
export function generateTokenPair(actor) {
  const payload = { sub: actor.id, role: actor.role };
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}
