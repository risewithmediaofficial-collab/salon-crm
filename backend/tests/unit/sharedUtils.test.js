import { describe, it, expect } from '@jest/globals';
import {
  formatCurrency,
  formatDuration,
  formatTime12Hour,
  timeToMinutes,
  minutesToTime,
  formatDateYMD,
} from '../../../shared/utils/index.js';

describe('Shared Utility Functions', () => {
  it('formats currency correctly with Indian Rupee symbol', () => {
    expect(formatCurrency(1500)).toContain('1,500');
    expect(formatCurrency(0)).toBe('₹0');
    expect(formatCurrency(null)).toBe('₹0');
    expect(formatCurrency(2500.5, '$')).toBe('$2,500.5');
  });

  it('formats duration in minutes and hours', () => {
    expect(formatDuration(30)).toBe('30 min');
    expect(formatDuration(60)).toBe('1h');
    expect(formatDuration(90)).toBe('1h 30m');
    expect(formatDuration(125)).toBe('2h 5m');
    expect(formatDuration(0)).toBe('0 min');
  });

  it('formats 24-hour time to 12-hour format with AM/PM', () => {
    expect(formatTime12Hour('09:30')).toBe('9:30 AM');
    expect(formatTime12Hour('12:00')).toBe('12:00 PM');
    expect(formatTime12Hour('15:45')).toBe('3:45 PM');
    expect(formatTime12Hour('00:15')).toBe('12:15 AM');
    expect(formatTime12Hour('')).toBe('');
  });

  it('converts between minutes and 24-hour format', () => {
    expect(timeToMinutes('14:30')).toBe(870);
    expect(timeToMinutes('')).toBe(0);

    expect(minutesToTime(870)).toBe('14:30');
    expect(minutesToTime(0)).toBe('00:00');
  });

  it('formats Date to YYYY-MM-DD string', () => {
    const d = new Date(2026, 11, 25);
    expect(formatDateYMD(d)).toBe('2026-12-25');
  });
});
