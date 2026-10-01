import { describe, it, expect } from '@jest/globals';
import {
  timesOverlap,
  addMinutes,
  formatTimeHHMM,
  timeToMinutes,
} from '../../src/utils/dateTime.js';

describe('Availability Engine & Time Calculations', () => {
  it('correctly detects overlapping time ranges', () => {
    const slotAStart = new Date('2026-10-15T10:00:00Z');
    const slotAEnd = new Date('2026-10-15T11:00:00Z');

    // Overlapping slot
    const slotBStart = new Date('2026-10-15T10:30:00Z');
    const slotBEnd = new Date('2026-10-15T11:30:00Z');
    expect(timesOverlap(slotAStart, slotAEnd, slotBStart, slotBEnd)).toBe(true);

    // Non-overlapping slot after
    const slotCStart = new Date('2026-10-15T11:00:00Z');
    const slotCEnd = new Date('2026-10-15T12:00:00Z');
    expect(timesOverlap(slotAStart, slotAEnd, slotCStart, slotCEnd)).toBe(false);

    // Completely inside
    const slotDStart = new Date('2026-10-15T10:15:00Z');
    const slotDEnd = new Date('2026-10-15T10:45:00Z');
    expect(timesOverlap(slotAStart, slotAEnd, slotDStart, slotDEnd)).toBe(true);
  });

  it('accurately adds minutes to a Date object', () => {
    const base = new Date('2026-10-15T10:00:00Z');
    const modified = addMinutes(base, 45);
    expect(modified.toISOString()).toBe('2026-10-15T10:45:00.000Z');
  });

  it('converts time strings to minutes correctly', () => {
    expect(timeToMinutes('09:00')).toBe(540);
    expect(timeToMinutes('14:30')).toBe(870);
    expect(timeToMinutes('00:00')).toBe(0);
    expect(timeToMinutes('23:59')).toBe(1439);
  });
});
