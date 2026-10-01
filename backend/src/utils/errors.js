/**
 * AppError — custom error class for controlled business errors.
 * These are safe to return to the client.
 */
export class AppError extends Error {
  constructor(message, statusCode = 400, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true; // mark as safe to expose
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ConflictError extends AppError {
  constructor(message, code = 'CONFLICT') {
    super(message, 409, code);
  }
}

export class ValidationError extends AppError {
  constructor(message, errors = null) {
    super(message, 422, 'VALIDATION_ERROR');
    this.validationErrors = errors;
  }
}

export class SlotUnavailableError extends AppError {
  constructor() {
    super('This time slot is no longer available. Please choose another.', 409, 'SLOT_UNAVAILABLE');
  }
}

export class InvalidTransitionError extends AppError {
  constructor(from, to) {
    super(`Cannot transition appointment from ${from} to ${to}`, 400, 'INVALID_TRANSITION');
  }
}
