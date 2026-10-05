import * as appointmentService from '../services/appointmentService.js';
import * as availabilityService from '../services/availabilityService.js';
import { successResponse, createdResponse } from '../utils/apiResponse.js';

export async function create(req, res, next) {
  try {
    const customerId = req.user.role === 'CUSTOMER' ? req.user.id : req.body.customerId;
    const { staffId, serviceId, serviceIds, appointmentDate, startTime, notes, offerCode } = req.body;

    const appointment = await appointmentService.createAppointment({
      customerId,
      staffId,
      serviceId,
      serviceIds,
      appointmentDate,
      startTimeStr: startTime,
      notes,
      offerCode,
    });

    return createdResponse(res, {
      message: 'Appointment booked successfully',
      data: appointment,
    });
  } catch (err) {
    next(err);
  }
}

export async function getAll(req, res, next) {
  try {
    const result = await appointmentService.getAppointments({
      query: req.query,
      userRole: req.user.role,
      userId: req.user.id,
    });

    return successResponse(res, {
      data: result.appointments,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
}

export async function getById(req, res, next) {
  try {
    const appointment = await appointmentService.getAppointmentById(req.params.id, {
      userRole: req.user.role,
      userId: req.user.id,
    });

    return successResponse(res, { data: appointment });
  } catch (err) {
    next(err);
  }
}

export async function updateStatus(req, res, next) {
  try {
    const appointment = await appointmentService.changeAppointmentStatus({
      appointmentId: req.params.id,
      newStatus: req.body.status,
      changedById: req.user.id,
      changedByModel: req.user.model,
      reason: req.body.reason,
    });

    return successResponse(res, {
      message: `Appointment status updated to ${req.body.status}`,
      data: appointment,
    });
  } catch (err) {
    next(err);
  }
}

export async function cancel(req, res, next) {
  try {
    const appointment = await appointmentService.cancelAppointment({
      appointmentId: req.params.id,
      customerId: req.user.id,
      reason: req.body.reason,
    });

    return successResponse(res, {
      message: 'Appointment cancelled successfully',
      data: appointment,
    });
  } catch (err) {
    next(err);
  }
}

export async function getSlots(req, res, next) {
  try {
    const { staffId, serviceId, serviceIds, date, slotInterval } = req.query;
    const slots = await availabilityService.getAvailableSlots({
      staffId,
      serviceId,
      serviceIds,
      date,
      slotInterval: slotInterval ? parseInt(slotInterval, 10) : 15,
    });

    return successResponse(res, { data: slots });
  } catch (err) {
    next(err);
  }
}

export async function submitReview(req, res, next) {
  try {
    const appointment = await appointmentService.submitReview({
      appointmentId: req.params.id,
      customerId: req.user.id,
      rating: req.body.rating,
      comment: req.body.comment,
    });

    return successResponse(res, {
      message: 'Review submitted successfully',
      data: appointment,
    });
  } catch (err) {
    next(err);
  }
}
