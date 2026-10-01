import mongoose from 'mongoose';
import { AUDIT_ACTION } from '../constants/index.js';

const { Schema } = mongoose;

const auditLogSchema = new Schema(
  {
    action: {
      type: String,
      enum: Object.values(AUDIT_ACTION),
      required: true,
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      refPath: 'performedByModel',
      required: true,
    },
    performedByModel: {
      type: String,
      enum: ['User', 'Customer'],
      required: true,
    },
    entityType: {
      type: String,
      required: true, // 'Appointment', 'Service', 'Staff', etc.
    },
    entityId: {
      type: Schema.Types.ObjectId,
    },
    description: {
      type: String,
      required: true,
      maxlength: 500,
    },
    metadata: {
      type: Schema.Types.Mixed, // before/after values, etc.
      default: {},
    },
    ipAddress: String,
    userAgent: String,
  },
  {
    timestamps: true,
  }
);

// Keep audit logs for queries by entity or by actor
auditLogSchema.index({ entityType: 1, entityId: 1 });
auditLogSchema.index({ performedBy: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

export default mongoose.model('AuditLog', auditLogSchema);
