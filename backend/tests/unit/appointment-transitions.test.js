import { describe, it, expect } from '@jest/globals';
import { APPOINTMENT_STATUS, VALID_TRANSITIONS } from '../../src/constants/index.js';

describe('Appointment Status Transition Matrix', () => {
  it('allows valid state progression for an appointment', () => {
    // PENDING can transition to ACCEPTED, REJECTED, CANCELLED
    const pendingNext = VALID_TRANSITIONS[APPOINTMENT_STATUS.PENDING];
    expect(pendingNext).toContain(APPOINTMENT_STATUS.ACCEPTED);
    expect(pendingNext).toContain(APPOINTMENT_STATUS.REJECTED);
    expect(pendingNext).toContain(APPOINTMENT_STATUS.CANCELLED);

    // ACCEPTED can transition to CONFIRMED, ARRIVED, etc.
    const acceptedNext = VALID_TRANSITIONS[APPOINTMENT_STATUS.ACCEPTED];
    expect(acceptedNext).toContain(APPOINTMENT_STATUS.CONFIRMED);
    expect(acceptedNext).toContain(APPOINTMENT_STATUS.ARRIVED);

    // IN_SERVICE can only transition to COMPLETED
    const inServiceNext = VALID_TRANSITIONS[APPOINTMENT_STATUS.IN_SERVICE];
    expect(inServiceNext).toEqual([APPOINTMENT_STATUS.COMPLETED]);
  });

  it('prohibits invalid or reverse transitions', () => {
    // PENDING cannot jump directly to COMPLETED or ARRIVED
    const pendingNext = VALID_TRANSITIONS[APPOINTMENT_STATUS.PENDING];
    expect(pendingNext).not.toContain(APPOINTMENT_STATUS.COMPLETED);
    expect(pendingNext).not.toContain(APPOINTMENT_STATUS.ARRIVED);

    // Terminal statuses cannot transition to anything
    expect(VALID_TRANSITIONS[APPOINTMENT_STATUS.COMPLETED]).toEqual([]);
    expect(VALID_TRANSITIONS[APPOINTMENT_STATUS.CANCELLED]).toEqual([]);
    expect(VALID_TRANSITIONS[APPOINTMENT_STATUS.REJECTED]).toEqual([]);
  });
});
