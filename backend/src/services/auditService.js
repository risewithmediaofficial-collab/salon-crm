/**
 * auditService.js — record admin/staff actions for audit trail
 */
import AuditLog from '../models/AuditLog.js';
import logger from '../utils/logger.js';

/**
 * Record an audit event.
 * Failures are non-fatal — they log a warning but don't throw.
 *
 * @param {object} params
 * @param {string} params.action - AUDIT_ACTION constant
 * @param {string} params.performedBy - User/Customer ObjectId
 * @param {string} params.performedByModel - 'User' | 'Customer'
 * @param {string} params.entityType - 'Appointment' | 'Service' | etc.
 * @param {string} [params.entityId]
 * @param {string} params.description - Human-readable description
 * @param {object} [params.metadata]
 * @param {string} [params.ipAddress]
 * @param {string} [params.userAgent]
 */
export async function recordAudit({
  action,
  performedBy,
  performedByModel,
  entityType,
  entityId,
  description,
  metadata = {},
  ipAddress,
  userAgent,
}) {
  try {
    await AuditLog.create({
      action,
      performedBy,
      performedByModel,
      entityType,
      entityId,
      description,
      metadata,
      ipAddress,
      userAgent,
    });
  } catch (err) {
    // Audit failures must not break the business flow
    logger.warn('Failed to write audit log', { action, error: err.message });
  }
}

/**
 * Get audit logs for an entity
 */
export async function getEntityAuditLogs(entityType, entityId, { page = 1, limit = 20 } = {}) {
  const skip = (page - 1) * limit;
  const [logs, total] = await Promise.all([
    AuditLog.find({ entityType, entityId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('performedBy', 'name email')
      .lean(),
    AuditLog.countDocuments({ entityType, entityId }),
  ]);
  return { logs, total };
}

export async function getAuditLogs({ page = 1, limit = 20, action, entityType } = {}) {
  const skip = (page - 1) * limit;
  const filter = {};
  if (action) filter.action = action;
  if (entityType) filter.entityType = entityType;

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('performedBy', 'name email role')
      .lean(),
    AuditLog.countDocuments(filter),
  ]);

  return { logs, total };
}

