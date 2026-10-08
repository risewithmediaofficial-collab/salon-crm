import { describe, it, expect } from '@jest/globals';
import {
  AppError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  ValidationError,
  SlotUnavailableError,
  InvalidTransitionError,
} from '../../src/utils/errors.js';

describe('Custom Error Classes', () => {
  it('instantiates AppError with default properties', () => {
    const err = new AppError('Something bad', 400, 'ERR_BAD');
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe('Something bad');
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('ERR_BAD');
    expect(err.isOperational).toBe(true);
  });

  it('instantiates NotFoundError with 404 and formatted message', () => {
    const err = new NotFoundError('Appointment');
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
    expect(err.message).toBe('Appointment not found');
  });

  it('instantiates UnauthorizedError with 401', () => {
    const err = new UnauthorizedError('Token expired');
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('UNAUTHORIZED');
    expect(err.message).toBe('Token expired');
  });

  it('instantiates ForbiddenError with 403', () => {
    const err = new ForbiddenError();
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe('FORBIDDEN');
    expect(err.message).toContain('do not have permission');
  });

  it('instantiates ConflictError with 409', () => {
    const err = new ConflictError('Email already in use', 'DUPLICATE_EMAIL');
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe('DUPLICATE_EMAIL');
    expect(err.message).toBe('Email already in use');
  });

  it('instantiates ValidationError with 422 and validation errors array', () => {
    const issues = [{ field: 'phone', message: 'Invalid format' }];
    const err = new ValidationError('Validation failed', issues);
    expect(err.statusCode).toBe(422);
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.validationErrors).toEqual(issues);
  });

  it('instantiates SlotUnavailableError with 409', () => {
    const err = new SlotUnavailableError();
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe('SLOT_UNAVAILABLE');
    expect(err.message).toContain('time slot is no longer available');
  });

  it('instantiates InvalidTransitionError with 400', () => {
    const err = new InvalidTransitionError('PENDING', 'COMPLETED');
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('INVALID_TRANSITION');
    expect(err.message).toBe('Cannot transition appointment from PENDING to COMPLETED');
  });
});
