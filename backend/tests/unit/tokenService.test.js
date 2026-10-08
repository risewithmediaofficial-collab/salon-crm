import { describe, it, expect } from '@jest/globals';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashRefreshToken,
  generateTokenPair,
} from '../../src/services/tokenService.js';

describe('Token Service', () => {
  const mockPayload = { sub: 'user_123', role: 'ADMIN' };

  it('generates a valid signed JWT access token', () => {
    const token = generateAccessToken(mockPayload);
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  });

  it('generates a valid refresh token and verifies it correctly', () => {
    const refreshToken = generateRefreshToken(mockPayload);
    expect(typeof refreshToken).toBe('string');

    const decoded = verifyRefreshToken(refreshToken);
    expect(decoded.sub).toBe('user_123');
    expect(decoded.role).toBe('ADMIN');
    expect(decoded.iss).toBe('salon-crm');
  });

  it('fails verification on tampered refresh token', () => {
    const refreshToken = generateRefreshToken(mockPayload);
    const tampered = refreshToken + 'xyz';
    expect(() => verifyRefreshToken(tampered)).toThrow();
  });

  it('hashes refresh token deterministically using SHA-256', () => {
    const token = 'sample-refresh-token';
    const hash = hashRefreshToken(token);
    expect(hash).toHaveLength(64);
    expect(hash).toBe(hashRefreshToken(token));
  });

  it('generates a token pair for an actor', () => {
    const pair = generateTokenPair({ id: 'staff_999', role: 'STAFF' });
    expect(pair).toHaveProperty('accessToken');
    expect(pair).toHaveProperty('refreshToken');

    const decoded = verifyRefreshToken(pair.refreshToken);
    expect(decoded.sub).toBe('staff_999');
    expect(decoded.role).toBe('STAFF');
  });
});
