import { describe, it, expect } from '@jest/globals';
import { generateOTP, hashOTP, verifyOTP, isOTPExpired } from '../../src/utils/otp.js';

describe('OTP Utilities', () => {
  it('generates a numeric OTP with specified length', () => {
    const otp6 = generateOTP(6);
    expect(otp6).toHaveLength(6);
    expect(/^\d{6}$/.test(otp6)).toBe(true);

    const otp4 = generateOTP(4);
    expect(otp4).toHaveLength(4);
    expect(/^\d{4}$/.test(otp4)).toBe(true);
  });

  it('hashes OTP consistently using SHA-256', () => {
    const rawOtp = '123456';
    const hash1 = hashOTP(rawOtp);
    const hash2 = hashOTP(rawOtp);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA-256 hex length
  });

  it('verifies valid OTP successfully', () => {
    const rawOtp = '654321';
    const hash = hashOTP(rawOtp);

    expect(verifyOTP(rawOtp, hash)).toBe(true);
    expect(verifyOTP('000000', hash)).toBe(false);
  });

  it('handles empty or malformed parameters in verifyOTP gracefully', () => {
    expect(verifyOTP('', 'somehash')).toBe(false);
    expect(verifyOTP('123456', '')).toBe(false);
    expect(verifyOTP(null, null)).toBe(false);
  });

  it('determines if OTP is expired accurately based on timestamp', () => {
    const pastTime = new Date(Date.now() - 60000); // 1 min ago
    const futureTime = new Date(Date.now() + 60000); // 1 min later

    expect(isOTPExpired(pastTime)).toBe(true);
    expect(isOTPExpired(futureTime)).toBe(false);
  });
});
