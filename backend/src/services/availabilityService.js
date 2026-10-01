/**
 * availabilityService.js
 *
 * The core appointment slot engine.
 * All availability checks MUST go through this service.
 * The frontend can display availability hints, but the backend always
 * performs the authoritative check before creating/modifying appointments.
 *
 * Key responsibilities:
 *  1. Determine staff working hours for a given date
 *  2. Check staff leaves
 *  3. Load existing confirmed/accepted/in-service appointments
 *  4. Generate available time slots accounting for service duration + buffer
 *  5. Check a specific slot for availability (used during booking with DB lock)
 */

import Appointment from '../models/Appointment.js';
import Staff from '../models/Staff.js';
import Service from '../models/Service.js';
import {
  startOfDay,
  endOfDay,
  addMinutes,
  setTimeOnDate,
  formatTimeHHMM,
  getDayOfWeek,
  timesOverlap,
} from '../utils/dateTime.js';
import { APPOINTMENT_STATUS } from '../constants/index.js';
import { AppError, NotFoundError } from '../utils/errors.js';

// Statuses that occupy a slot
const BLOCKING_STATUSES = [
  APPOINTMENT_STATUS.PENDING,
  APPOINTMENT_STATUS.ACCEPTED,
  APPOINTMENT_STATUS.CONFIRMED,
  APPOINTMENT_STATUS.ARRIVED,
  APPOINTMENT_STATUS.IN_SERVICE,
  APPOINTMENT_STATUS.RESCHEDULED,
];

/**
 * Check if a staff member is on leave for a given date.
 * @param {Array} leaves - Staff leave array
 * @param {Date} date
 * @returns {boolean}
 */
function isStaffOnLeave(leaves, date) {
  const d = new Date(date);
  return leaves.some((leave) => {
    const start = new Date(leave.startDate);
    const end = new Date(leave.endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return d >= start && d <= end;
  });
}

/**
 * Get working hours for a staff member on a given date.
 * @param {Array} workingHours
 * @param {Date} date
 * @returns {{ isWorking: boolean, startTime: string, endTime: string } | null}
 */
function getWorkingHoursForDate(workingHours, date) {
  const dayOfWeek = getDayOfWeek(date);
  return workingHours.find((wh) => wh.dayOfWeek === dayOfWeek) || null;
}

/**
 * Load all blocking appointments for a staff member on a given date.
 * Uses a lean query for performance.
 * @param {string} staffId
 * @param {Date} date
 * @returns {Promise<Array>}
 */
async function getBlockingAppointments(staffId, date) {
  return Appointment.find({
    staff: staffId,
    appointmentDate: {
      $gte: startOfDay(date),
      $lte: endOfDay(date),
    },
    status: { $in: BLOCKING_STATUSES },
  })
    .select('startTime endTime status')
    .lean();
}

/**
 * Generate available time slots for a staff+service combination on a date.
 *
 * Algorithm:
 *  1. Check staff exists and is active
 *  2. Check staff works that day (working hours)
 *  3. Check staff is not on leave
 *  4. Get service duration + buffer
 *  5. Load existing blocking appointments
 *  6. Walk through the day in [slotInterval] minute increments
 *     For each slot: check if [start, start + duration + buffer] fits
 *     within working hours AND doesn't overlap any existing appointment.
 *  7. Only return future slots (past slots are excluded)
 *
 * @param {object} params
 * @param {string} params.staffId
 * @param {string} params.serviceId
 * @param {Date|string} params.date
 * @param {number} [params.slotInterval=15] - minutes between slot options
 * @returns {Promise<{ available: boolean, slots: Array<{ startTime: string, endTime: string }> }>}
 */
export async function getAvailableSlots({ staffId, serviceId, date, slotInterval = 15 }) {
  const targetDate = new Date(date);

  const [staff, service] = await Promise.all([
    Staff.findById(staffId).select('workingHours leaves isActive services').lean(),
    Service.findById(serviceId).select('duration bufferTime isActive').lean(),
  ]);

  if (!staff || !staff.isActive) {
    throw new NotFoundError('Staff member');
  }
  if (!service || !service.isActive) {
    throw new NotFoundError('Service');
  }

  // Check staff can perform this service
  const canPerform = staff.services.some(
    (s) => String(s) === String(serviceId)
  );
  if (!canPerform) {
    throw new AppError('This staff member does not perform the selected service', 400, 'STAFF_SERVICE_MISMATCH');
  }

  // Check leave
  if (isStaffOnLeave(staff.leaves, targetDate)) {
    return { available: false, slots: [], reason: 'STAFF_ON_LEAVE' };
  }

  // Check working hours
  const workingHour = getWorkingHoursForDate(staff.workingHours, targetDate);
  if (!workingHour || !workingHour.isWorking) {
    return { available: false, slots: [], reason: 'NOT_WORKING_DAY' };
  }

  const totalSlotMinutes = service.duration + (service.bufferTime || 0);

  // Work window
  const workStart = setTimeOnDate(targetDate, workingHour.startTime);
  const workEnd = setTimeOnDate(targetDate, workingHour.endTime);

  // Load existing appointments
  const existingAppointments = await getBlockingAppointments(staffId, targetDate);

  const now = new Date();
  const slots = [];

  // Walk through slots
  let cursor = new Date(workStart);
  while (cursor < workEnd) {
    const slotStart = new Date(cursor);
    const slotEnd = addMinutes(slotStart, service.duration);
    const slotEndWithBuffer = addMinutes(slotStart, totalSlotMinutes);

    // Must fit within working hours
    if (slotEndWithBuffer > workEnd) break;

    // Must be in the future (at least 30 minutes from now)
    const isInFuture = slotStart > addMinutes(now, 30);

    if (isInFuture) {
      // Check no overlap with existing appointments
      const hasConflict = existingAppointments.some((appt) =>
        timesOverlap(
          slotStart,
          slotEndWithBuffer,
          new Date(appt.startTime),
          new Date(appt.endTime)
        )
      );

      if (!hasConflict) {
        slots.push({
          startTime: formatTimeHHMM(slotStart),
          endTime: formatTimeHHMM(slotEnd),
          startDateTime: slotStart.toISOString(),
          endDateTime: slotEnd.toISOString(),
        });
      }
    }

    cursor = addMinutes(cursor, slotInterval);
  }

  return { available: slots.length > 0, slots };
}

/**
 * Authoritative slot check — called during actual booking.
 * This is the FINAL check that prevents double-booking.
 *
 * Must be called inside a MongoDB session/transaction for full safety.
 *
 * @param {object} params
 * @param {string} params.staffId
 * @param {Date} params.startTime
 * @param {Date} params.endTime
 * @param {string} [params.excludeAppointmentId] - exclude current appointment (rescheduling)
 * @returns {Promise<boolean>} - true if slot is available
 */
export async function isSlotAvailable({ staffId, startTime, endTime, excludeAppointmentId = null }) {
  const query = {
    staff: staffId,
    status: { $in: BLOCKING_STATUSES },
    $or: [
      // Existing appointment overlaps with requested slot
      {
        startTime: { $lt: endTime },
        endTime: { $gt: startTime },
      },
    ],
  };

  if (excludeAppointmentId) {
    query._id = { $ne: excludeAppointmentId };
  }

  const conflict = await Appointment.findOne(query).select('_id').lean();
  return !conflict;
}

/**
 * Validate that all business rules are met before creating an appointment.
 * Returns a validated, enriched booking object or throws an AppError.
 *
 * @param {object} params
 * @param {string} params.staffId
 * @param {string} params.serviceId
 * @param {string} params.customerId
 * @param {Date|string} params.appointmentDate
 * @param {string} params.startTimeStr - "HH:MM"
 * @returns {Promise<object>} - { staff, service, startTime, endTime, appointmentDate }
 */
export async function validateAndPrepareBooking({ staffId, serviceId, customerId, appointmentDate, startTimeStr }) {
  const date = new Date(appointmentDate);

  // Prevent past-date bookings
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date < today) {
    throw new AppError('Cannot book appointments in the past', 400, 'PAST_DATE');
  }

  const [staff, service] = await Promise.all([
    Staff.findById(staffId).select('workingHours leaves isActive services name').lean(),
    Service.findById(serviceId).select('duration bufferTime price taxRate isActive name').lean(),
  ]);

  if (!staff || !staff.isActive) throw new NotFoundError('Staff member');
  if (!service || !service.isActive) throw new AppError('This service is not currently available', 400, 'SERVICE_INACTIVE');

  // Check staff can perform service
  const canPerform = staff.services.some((s) => String(s) === String(serviceId));
  if (!canPerform) throw new AppError('This staff member does not perform the selected service', 400, 'STAFF_SERVICE_MISMATCH');

  // Check leave
  if (isStaffOnLeave(staff.leaves, date)) {
    throw new AppError('The selected staff member is unavailable on this date', 409, 'STAFF_ON_LEAVE');
  }

  // Check working hours
  const workingHour = getWorkingHoursForDate(staff.workingHours, date);
  if (!workingHour || !workingHour.isWorking) {
    throw new AppError('The salon is not open on this day', 409, 'NOT_WORKING_DAY');
  }

  const startTime = setTimeOnDate(date, startTimeStr);
  const endTime = addMinutes(startTime, service.duration);
  const endTimeWithBuffer = addMinutes(startTime, service.duration + (service.bufferTime || 0));

  // Validate slot fits within working hours
  const workStart = setTimeOnDate(date, workingHour.startTime);
  const workEnd = setTimeOnDate(date, workingHour.endTime);
  if (startTime < workStart || endTimeWithBuffer > workEnd) {
    throw new AppError('The selected time slot is outside working hours', 400, 'OUTSIDE_WORKING_HOURS');
  }

  // Future check
  if (startTime <= addMinutes(new Date(), 30)) {
    throw new AppError('Appointments must be booked at least 30 minutes in advance', 400, 'TOO_SOON');
  }

  return {
    staff,
    service,
    startTime,
    endTime,
    endTimeWithBuffer,
    appointmentDate: startOfDay(date),
  };
}
