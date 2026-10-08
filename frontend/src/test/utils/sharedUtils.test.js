import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatDuration,
  formatTime12Hour,
  timeToMinutes,
  minutesToTime,
  formatDateYMD,
} from '@shared/utils/index.js';
import {
  isValidIndianPhone,
  isValidEmail,
  isValidTimeFormat,
  isValidDateFormat,
} from '@shared/validation-rules/index.js';

describe('Frontend Shared Utilities & Validation Rules', () => {
  it('formats currency correctly in INR format', () => {
    expect(formatCurrency(499)).toBe('₹499');
    expect(formatCurrency(1200.5)).toContain('1,200.5');
  });

  it('formats duration in minutes and hours properly', () => {
    expect(formatDuration(45)).toBe('45 min');
    expect(formatDuration(60)).toBe('1h');
    expect(formatDuration(90)).toBe('1h 30m');
  });

  it('formats time to 12-hour AM/PM format', () => {
    expect(formatTime12Hour('10:00')).toBe('10:00 AM');
    expect(formatTime12Hour('14:30')).toBe('2:30 PM');
  });

  it('validates mobile numbers with Indian format', () => {
    expect(isValidIndianPhone('9876543210')).toBe(true);
    expect(isValidIndianPhone('12345')).toBe(false);
  });

  it('validates email addresses', () => {
    expect(isValidEmail('test@salon.com')).toBe(true);
    expect(isValidEmail('invalid')).toBe(false);
  });
});
