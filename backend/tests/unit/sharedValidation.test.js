import { describe, it, expect } from '@jest/globals';
import {
  isValidIndianPhone,
  isValidEmail,
  isValidTimeFormat,
  isValidDateFormat,
  VALIDATION_LIMITS,
} from '../../../shared/validation-rules/index.js';

describe('Shared Validation Rules', () => {
  describe('isValidIndianPhone', () => {
    it('validates 10-digit Indian numbers starting with 6-9', () => {
      expect(isValidIndianPhone('9876543210')).toBe(true);
      expect(isValidIndianPhone('8123456789')).toBe(true);
      expect(isValidIndianPhone('7000000000')).toBe(true);
      expect(isValidIndianPhone('6123456789')).toBe(true);
    });

    it('accepts country code prefixes like +91', () => {
      expect(isValidIndianPhone('+919876543210')).toBe(true);
      expect(isValidIndianPhone('919876543210')).toBe(true);
    });

    it('rejects numbers starting with invalid digits (0-5) or improper lengths', () => {
      expect(isValidIndianPhone('5123456789')).toBe(false);
      expect(isValidIndianPhone('12345')).toBe(false);
      expect(isValidIndianPhone('987654321')).toBe(false);
      expect(isValidIndianPhone('')).toBe(false);
      expect(isValidIndianPhone(null)).toBe(false);
    });
  });

  describe('isValidEmail', () => {
    it('validates standard email formats', () => {
      expect(isValidEmail('user@salon.com')).toBe(true);
      expect(isValidEmail('john.doe+test@gmail.co.in')).toBe(true);
    });

    it('rejects invalid email formats', () => {
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail(null)).toBe(false);
    });
  });

  describe('isValidTimeFormat', () => {
    it('validates HH:mm 24-hour format', () => {
      expect(isValidTimeFormat('00:00')).toBe(true);
      expect(isValidTimeFormat('09:30')).toBe(true);
      expect(isValidTimeFormat('23:59')).toBe(true);
    });

    it('rejects invalid time formats', () => {
      expect(isValidTimeFormat('24:00')).toBe(false);
      expect(isValidTimeFormat('12:60')).toBe(false);
      expect(isValidTimeFormat('9:30')).toBe(false);
      expect(isValidTimeFormat('random')).toBe(false);
    });
  });

  describe('isValidDateFormat', () => {
    it('validates YYYY-MM-DD format', () => {
      expect(isValidDateFormat('2026-10-15')).toBe(true);
      expect(isValidDateFormat('2025-01-01')).toBe(true);
    });

    it('rejects malformed dates', () => {
      expect(isValidDateFormat('15-10-2026')).toBe(false);
      expect(isValidDateFormat('2026/10/15')).toBe(false);
      expect(isValidDateFormat('invalid')).toBe(false);
    });
  });

  describe('VALIDATION_LIMITS', () => {
    it('provides standard business validation boundaries', () => {
      expect(VALIDATION_LIMITS.NAME_MIN).toBe(2);
      expect(VALIDATION_LIMITS.PASSWORD_MIN).toBe(8);
      expect(VALIDATION_LIMITS.MAX_DURATION).toBe(480);
      expect(VALIDATION_LIMITS.MIN_PRICE).toBe(0);
    });
  });
});
