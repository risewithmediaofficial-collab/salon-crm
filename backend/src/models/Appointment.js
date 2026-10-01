import mongoose from 'mongoose';
import { APPOINTMENT_STATUS } from '../constants/index.js';

const { Schema } = mongoose;

/**
 * Billing snapshot — captured at booking time so price changes later
 * don't affect historical records.
 */
const billingSnapshotSchema = new Schema(
  {
    serviceName: { type: String, required: true },
    servicePrice: { type: Number, required: true },
    taxRate: { type: Number, required: true },
    taxAmount: { type: Number, required: true },
    discountAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
  },
  { _id: false }
);

const appointmentSchema = new Schema(
  {
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    staff: {
      type: Schema.Types.ObjectId,
      ref: 'Staff',
      required: true,
    },
    service: {
      type: Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
    },
    // Date stored as UTC midnight for the appointment date
    appointmentDate: {
      type: Date,
      required: true,
    },
    // Start/end as full ISO datetime (UTC)
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(APPOINTMENT_STATUS),
      default: APPOINTMENT_STATUS.PENDING,
    },
    notes: {
      type: String,
      maxlength: 500,
    },
    // Captured at booking time — immutable billing reference
    billingSnapshot: billingSnapshotSchema,
    // Applied offer (if any)
    offer: {
      type: Schema.Types.ObjectId,
      ref: 'Offer',
      default: null,
    },
    // Audit trail of status changes
    statusHistory: [
      {
        status: {
          type: String,
          enum: Object.values(APPOINTMENT_STATUS),
        },
        changedBy: {
          type: Schema.Types.ObjectId,
          // Can be User (admin/staff) or Customer
          refPath: 'statusHistory.changedByModel',
        },
        changedByModel: {
          type: String,
          enum: ['User', 'Customer'],
        },
        reason: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Rescheduling request fields
    rescheduleRequest: {
      requestedDate: Date,
      requestedStartTime: Date,
      requestedEndTime: Date,
      reason: String,
      requestedAt: Date,
    },
    // Customer review (after completion)
    review: {
      rating: { type: Number, min: 1, max: 5 },
      comment: { type: String, maxlength: 500 },
      submittedAt: Date,
    },
    // Invoice link
    invoice: {
      type: Schema.Types.ObjectId,
      ref: 'Invoice',
      default: null,
    },
  },
  { timestamps: true }
);

// Critical indexes for appointment queries
appointmentSchema.index({ customer: 1, appointmentDate: -1 });
appointmentSchema.index({ staff: 1, appointmentDate: 1 });
appointmentSchema.index({ appointmentDate: 1, status: 1 });
appointmentSchema.index({ status: 1 });
// Compound index for availability check
appointmentSchema.index({ staff: 1, startTime: 1, endTime: 1, status: 1 });

export default mongoose.model('Appointment', appointmentSchema);
