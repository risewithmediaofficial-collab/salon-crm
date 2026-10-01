import logger from '../utils/logger.js';
import { AppError } from '../utils/errors.js';
import { errorResponse } from '../utils/apiResponse.js';
import env from '../config/environment.js';

/**
 * Global error handler — must be the last middleware registered.
 * Converts all errors to safe API responses.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  // Known operational errors — safe to expose message
  if (err.isOperational) {
    logger.warn('Operational error', {
      message: err.message,
      code: err.code,
      path: req.path,
      method: req.method,
    });

    return errorResponse(res, {
      statusCode: err.statusCode,
      message: err.message,
      code: err.code,
      errors: err.validationErrors || null,
    });
  }

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return errorResponse(res, {
      statusCode: 422,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors,
    });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return errorResponse(res, {
      statusCode: 409,
      message: `A record with this ${field} already exists.`,
      code: 'DUPLICATE_KEY',
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return errorResponse(res, {
      statusCode: 401,
      message: 'Invalid or expired token',
      code: 'UNAUTHORIZED',
    });
  }

  // Unhandled / unknown errors — log detailed, expose generic message
  logger.error('Unhandled error', {
    message: err.message,
    stack: env.isDevelopment() ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  return errorResponse(res, {
    statusCode: 500,
    message: 'An unexpected error occurred. Please try again later.',
    code: 'INTERNAL_ERROR',
  });
}

/**
 * 404 handler — mount before errorHandler for unmatched routes
 */
export function notFoundHandler(req, res) {
  return errorResponse(res, {
    statusCode: 404,
    message: `Cannot ${req.method} ${req.path}`,
    code: 'NOT_FOUND',
  });
}
