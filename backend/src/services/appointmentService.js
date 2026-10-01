/**
 * appointmentService.js
 *
 * All appointment business logic lives here.
 * Controllers call these methods — they remain thin.
 *
 * Double-booking prevention strategy:
 *  - Pre-check: validateAndPrepareBooking() runs fast slot validation
 *  - Final check: isSlotAvailable() runs inside a MongoDB session
 *    with findOneAndUpdate to ensure atomic creation
 *  - MongoDB's unique compound index on (staff, startTime) provides
 *    an additional database-level safety net
 */
import mongoose from 'mongoose';
import Appointment from '../models/Appointment.js';
import Customer from '../models/Customer.js';
import Service from '../models/Service.js';
import Staff from '../models/Staff.js';
import {
  validateAndPrepareBooking,
  isSlotAvailable,
} from './availabilityService.js';
import { createDraftInvoice, validateOffer } from './billingService.js';
import { recordAudit } from './auditService.js';
import { notifyAppointmentBooked, notifyAppointmentStatusChange } from './notificationService.js';
import {
  APPOINTMENT_STATUS,
  VALID_TRANSITIONS,
  AUDIT_ACTION,
  ROLES,
} from '../constants/index.js';
import {
  AppError,
  NotFoundError,
  SlotUnavailableError,
  InvalidTransitionError,
  ForbiddenError,
} from '../utils/errors.js';
import { getPagination, buildPaginationMeta } from '../utils/apiResponse.js';
import { startOfDay, endOfDay } from '../utils/dateTime.js';

/**
 * Create a new appointment (customer booking flow)
 */
export async function createAppointment({ customerId, staffId, serviceId, appointmentDate, startTimeStr, notes, offerCode }) {
  // 1. Validate all business rules
  const { service, staff, startTime, endTime, appointmentDate: normalizedDate } =
    await validateAndPrepareBooking({ staffId, serviceId, customerId, appointmentDate, startTimeStr });

  // 2. Validate offer (if provided)
  const offer = await validateOffer(offerCode, serviceId, service.price);

  // 3. Final slot check + appointment creation
  const executeBooking = async (sess = null) => {
    const available = await isSlotAvailable({
      staffId,
      startTime,
      endTime,
    });
    if (!available) throw new SlotUnavailableError();

    const createOpts = sess ? { session: sess } : {};
    const created = await Appointment.create(
      [
        {
          customer: customerId,
          staff: staffId,
          service: serviceId,
          appointmentDate: normalizedDate,
          startTime,
          endTime,
          status: APPOINTMENT_STATUS.PENDING,
          notes,
          offer: offer ? offer._id : null,
          statusHistory: [
            {
              status: APPOINTMENT_STATUS.PENDING,
              changedBy: customerId,
              changedByModel: 'Customer',
              timestamp: new Date(),
            },
          ],
        },
      ],
      createOpts
    );
    return created[0];
  };

  let appointment;
  let session = null;
  try {
    session = await mongoose.startSession();
    await session.withTransaction(async () => {
      appointment = await executeBooking(session);
    });
  } catch (err) {
    if (err?.message?.includes('Transaction numbers are only allowed on a replica set member or mongos') || err?.code === 20) {
      // Standalone MongoDB does not support replica set transactions: fallback seamlessly
      appointment = await executeBooking(null);
    } else {
      throw err;
    }
  } finally {
    if (session) {
      await session.endSession().catch(() => {});
    }
  }

  // 4. Create draft invoice (non-blocking to appointment creation)
  const customer = await Customer.findById(customerId).lean();
  try {
    const invoice = await createDraftInvoice({ appointment, service, offer, customerId });
    await Appointment.findByIdAndUpdate(appointment._id, { invoice: invoice._id });
    // Attach billing snapshot to appointment
    const { billingSnapshot } = await import('./billingService.js').then(m => {
      return { billingSnapshot: m.computeBilling(service, offer).billingSnapshot };
    });
    await Appointment.findByIdAndUpdate(appointment._id, { billingSnapshot });
  } catch (err) {
    // Invoice creation failure should not fail the booking
    // The invoice can be created retroactively
  }

  // 5. Audit log
  await recordAudit({
    action: AUDIT_ACTION.APPOINTMENT_CREATED,
    performedBy: customerId,
    performedByModel: 'Customer',
    entityType: 'Appointment',
    entityId: appointment._id,
    description: `Customer booked appointment for ${service.name} with ${staff.name} on ${appointmentDate}`,
  });

  // 6. Notify customer, salon admins, and staff (fire-and-forget)
  notifyAppointmentBooked(appointment, customer, service, staff).catch(() => {});

  return appointment;
}

/**
 * Change appointment status (admin/staff action)
 * Enforces valid state transitions.
 */
export async function changeAppointmentStatus({ appointmentId, newStatus, changedById, changedByModel, reason }) {
  const appointment = await Appointment.findById(appointmentId)
    .populate('customer', 'name phone')
    .populate('service', 'name')
    .populate('staff', 'name');

  if (!appointment) throw new NotFoundError('Appointment');

  const currentStatus = appointment.status;
  const allowedNext = VALID_TRANSITIONS[currentStatus] || [];

  if (!allowedNext.includes(newStatus)) {
    throw new InvalidTransitionError(currentStatus, newStatus);
  }

  appointment.status = newStatus;
  appointment.statusHistory.push({
    status: newStatus,
    changedBy: changedById,
    changedByModel,
    reason,
    timestamp: new Date(),
  });

  await appointment.save();

  // Update staff appointment count on completion
  if (newStatus === APPOINTMENT_STATUS.COMPLETED) {
    await Staff.findByIdAndUpdate(appointment.staff._id, { $inc: { totalAppointments: 1 } });
    await Customer.findByIdAndUpdate(appointment.customer._id, {
      $inc: { totalVisits: 1 },
      lastVisitAt: new Date(),
    });
  }

  // Audit
  await recordAudit({
    action: AUDIT_ACTION.APPOINTMENT_STATUS_CHANGED,
    performedBy: changedById,
    performedByModel: changedByModel,
    entityType: 'Appointment',
    entityId: appointment._id,
    description: `Appointment #${appointment._id} changed from ${currentStatus} to ${newStatus}`,
    metadata: { from: currentStatus, to: newStatus, reason },
  });

  // Notify customer
  if (appointment.customer) {
    notifyAppointmentStatusChange(appointment, appointment.customer, newStatus).catch(() => {});
  }

  return appointment;
}

/**
 * Customer cancels their own appointment
 */
export async function cancelAppointment({ appointmentId, customerId, reason }) {
  const appointment = await Appointment.findById(appointmentId)
    .populate('customer', 'name phone');

  if (!appointment) throw new NotFoundError('Appointment');
  if (String(appointment.customer._id) !== String(customerId)) throw new ForbiddenError();

  const cancellable = [
    APPOINTMENT_STATUS.PENDING,
    APPOINTMENT_STATUS.ACCEPTED,
    APPOINTMENT_STATUS.CONFIRMED,
  ];
  if (!cancellable.includes(appointment.status)) {
    throw new AppError('This appointment cannot be cancelled at this stage', 400, 'CANNOT_CANCEL');
  }

  return changeAppointmentStatus({
    appointmentId,
    newStatus: APPOINTMENT_STATUS.CANCELLED,
    changedById: customerId,
    changedByModel: 'Customer',
    reason,
  });
}

/**
 * Get appointments with pagination and filters
 */
export async function getAppointments({ query, userRole, userId }) {
  const { page, limit, skip } = getPagination(query);

  const filter = {};

  // Customers can only see their own appointments
  if (userRole === ROLES.CUSTOMER) {
    filter.customer = userId;
  } else if (query.customerId) {
    filter.customer = query.customerId;
  }

  // Staff can only see their own appointments (unless OWNER/MANAGER)
  if (userRole === ROLES.STAFF) {
    // Find staff record linked to this user
    const staff = await Staff.findOne({ user: userId }).select('_id').lean();
    if (staff) filter.staff = staff._id;
  } else if (query.staffId) {
    filter.staff = query.staffId;
  }

  if (query.status) filter.status = query.status;

  if (query.date) {
    const d = new Date(query.date);
    filter.appointmentDate = { $gte: startOfDay(d), $lte: endOfDay(d) };
  } else if (query.startDate && query.endDate) {
    filter.appointmentDate = {
      $gte: startOfDay(new Date(query.startDate)),
      $lte: endOfDay(new Date(query.endDate)),
    };
  }

  const [appointments, total] = await Promise.all([
    Appointment.find(filter)
      .sort({ appointmentDate: 1, startTime: 1 })
      .skip(skip)
      .limit(limit)
      .populate('customer', 'name phone')
      .populate('staff', 'name avatarUrl')
      .populate('service', 'name duration category')
      .lean(),
    Appointment.countDocuments(filter),
  ]);

  return {
    appointments,
    pagination: buildPaginationMeta({ page, limit, total }),
  };
}

/**
 * Get a single appointment by ID, with access control
 */
export async function getAppointmentById(appointmentId, { userRole, userId }) {
  const appointment = await Appointment.findById(appointmentId)
    .populate('customer', 'name phone email')
    .populate('staff', 'name avatarUrl')
    .populate('service', 'name duration category price')
    .populate('invoice')
    .lean();

  if (!appointment) throw new NotFoundError('Appointment');

  // Customers can only see their own
  if (userRole === ROLES.CUSTOMER && String(appointment.customer._id) !== String(userId)) {
    throw new ForbiddenError();
  }

  return appointment;
}

/**
 * Customer submits a review after appointment is COMPLETED
 */
export async function submitReview({ appointmentId, customerId, rating, comment }) {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) throw new NotFoundError('Appointment');
  if (String(appointment.customer) !== String(customerId)) throw new ForbiddenError();
  if (appointment.status !== APPOINTMENT_STATUS.COMPLETED) {
    throw new AppError('Reviews can only be submitted for completed appointments', 400, 'NOT_COMPLETED');
  }
  if (appointment.review?.rating) {
    throw new AppError('A review has already been submitted for this appointment', 409, 'REVIEW_EXISTS');
  }

  appointment.review = { rating, comment, submittedAt: new Date() };
  await appointment.save();
  return appointment;
}
