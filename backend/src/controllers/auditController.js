import * as auditService from '../services/auditService.js';
import { successResponse } from '../utils/apiResponse.js';

export async function getAll(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));

    const result = await auditService.getAuditLogs({
      page,
      limit,
      action: req.query.action,
      entityType: req.query.entityType,
    });

    return successResponse(res, {
      data: result.logs,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
}
