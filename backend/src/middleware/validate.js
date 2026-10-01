import { validationResult } from 'express-validator';
import { errorResponse } from '../utils/apiResponse.js';

/**
 * Run after express-validator chains.
 * Returns 422 with field-level errors if validation fails.
 */
export function validate(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  const formattedErrors = errors.array().map((e) => ({
    field: e.path,
    message: e.msg,
  }));

  return errorResponse(res, {
    statusCode: 422,
    message: 'Validation failed',
    code: 'VALIDATION_ERROR',
    errors: formattedErrors,
  });
}
