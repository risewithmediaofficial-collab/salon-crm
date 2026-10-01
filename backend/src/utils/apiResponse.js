/**
 * Centralized API response helpers — consistent shape across all endpoints.
 */

/**
 * Success response
 * @param {object} res - Express response
 * @param {object} options
 */
export function successResponse(res, { statusCode = 200, message = 'Success', data = null, pagination = null } = {}) {
  const body = { success: true, message };
  if (data !== null) body.data = data;
  if (pagination !== null) body.pagination = pagination;
  return res.status(statusCode).json(body);
}

/**
 * Created response (201)
 * @param {object} res - Express response
 * @param {object} options
 */
export function createdResponse(res, { message = 'Created successfully', data = null } = {}) {
  return successResponse(res, { statusCode: 201, message, data });
}

/**
 * Error response — safe, never exposes internals
 * @param {object} res - Express response
 * @param {object} options
 */
export function errorResponse(res, { statusCode = 500, message = 'Something went wrong', code = null, errors = null } = {}) {
  const body = { success: false, message };
  if (code) body.code = code;
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
}

/**
 * Build a pagination object from query params
 */
export function getPagination(query, defaults = { page: 1, limit: 20 }) {
  const page = Math.max(1, parseInt(query.page, 10) || defaults.page);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || defaults.limit));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

/**
 * Build pagination metadata for response
 */
export function buildPaginationMeta({ page, limit, total }) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page < Math.ceil(total / limit),
    hasPrevPage: page > 1,
  };
}
