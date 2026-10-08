import { describe, it, expect } from '@jest/globals';
import {
  startOfDay,
  endOfDay,
  addMinutes,
  timesOverlap,
  parseTimeString,
  setTimeOnDate,
  formatTimeHHMM,
  formatDateYMD,
  getDayOfWeek,
  timeToMinutes,
  minutesToTime,
} from '../../src/utils/dateTime.js';

describe('DateTime Utility Functions', () => {
  it('correctly calculates startOfDay (00:00:00.000)', () => {
    const input = new Date('2026-10-15T15:30:45.500Z');
    const start = startOfDay(input);
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
    expect(start.getSeconds()).toBe(0);
    expect(start.getMilliseconds()).toBe(0);
  });

  it('correctly calculates endOfDay (23:59:59.999)', () => {
    const input = new Date('2026-10-15T15:30:45.500Z');
    const end = endOfDay(input);
    expect(end.getHours()).toBe(23);
    expect(end.getMinutes()).toBe(59);
    expect(end.getSeconds()).toBe(59);
    expect(end.getMilliseconds()).toBe(999);
  });

  it('parses HH:MM time strings into hours and minutes objects', () => {
    expect(parseTimeString('08:30')).toEqual({ hours: 8, minutes: 30 });
    expect(parseTimeString('23:45')).toEqual({ hours: 23, minutes: 45 });
    expect(parseTimeString('00:00')).toEqual({ hours: 0, minutes: 0 });
  });

  it('sets time on a given date using setTimeOnDate', () => {
    const baseDate = new Date('2026-05-10T00:00:00');
    const updated = setTimeOnDate(baseDate, '14:25');
    expect(updated.getHours()).toBe(14);
    expect(updated.getMinutes()).toBe(25);
    expect(updated.getSeconds()).toBe(0);
  });

  it('formats dates into HH:MM string with zero padding', () => {
    const d1 = new Date(2026, 4, 10, 9, 5);
    expect(formatTimeHHMM(d1)).toBe('09:05');

    const d2 = new Date(2026, 4, 10, 18, 45);
    expect(formatTimeHHMM(d2)).toBe('18:45');
  });

  it('formats dates into YYYY-MM-DD format', () => {
    const d = new Date(2026, 0, 5); // Jan 5, 2026
    expect(formatDateYMD(d)).toBe('2026-01-05');
  });

  it('retrieves the correct day of week index', () => {
    const sunday = new Date('2026-10-11T12:00:00Z');
    expect(getDayOfWeek(sunday)).toBe(0); // 0 = Sunday
    const monday = new Date('2026-10-12T12:00:00Z');
    expect(getDayOfWeek(monday)).toBe(1);
  });

  it('converts time strings to total minutes and vice-versa', () => {
    expect(timeToMinutes('01:30')).toBe(90);
    expect(timeToMinutes('00:00')).toBe(0);
    expect(timeToMinutes('')).toBe(0);
    expect(timeToMinutes(null)).toBe(0);

    expect(minutesToTime(90)).toBe('01:30');
    expect(minutesToTime(0)).toBe('00:00');
    expect(minutesToTime(750)).toBe('12:30');
  });

  it('accurately assesses timesOverlap across adjacent and overlapping intervals', () => {
    const t1 = new Date('2026-01-01T10:00:00Z');
    const t2 = new Date('2026-01-01T11:00:00Z');
    const t3 = new Date('2026-01-01T11:00:00Z');
    const t4 = new Date('2026-01-01T12:00:00Z');

    // Adjacent slots do not overlap
    expect(timesOverlap(t1, t2, t3, t4)).toBe(false);

    // Overlapping slots
    const oStart = new Date('2026-01-01T10:30:00Z');
    const oEnd = new Date('2026-01-01T11:30:00Z');
    expect(timesOverlap(t1, t2, oStart, oEnd)).toBe(true);
  });
});
