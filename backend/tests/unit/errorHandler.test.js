import { describe, it, expect, jest } from '@jest/globals';
import { errorHandler, notFoundHandler } from '../../src/middleware/errorHandler.js';
import { AppError, NotFoundError } from '../../src/utils/errors.js';

describe('Error Handler Middleware Unit Tests', () => {
  const createMockRes = () => {
    const res = {};
    res.statusCode = 200;
    res.status = jest.fn().mockImplementation((code) => {
      res.statusCode = code;
      return res;
    });
    res.json = jest.fn().mockImplementation((data) => {
      res.body = data;
      return res;
    });
    return res;
  };

  const req = { path: '/api/test', method: 'GET' };

  it('handles operational AppError properly', () => {
    const err = new NotFoundError('Customer');
    const res = createMockRes();

    errorHandler(err, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Customer not found');
    expect(res.body.code).toBe('NOT_FOUND');
  });

  it('handles Mongoose ValidationError format', () => {
    const err = {
      name: 'ValidationError',
      errors: {
        name: { path: 'name', message: 'Name is required' },
      },
    };
    const res = createMockRes();

    errorHandler(err, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.errors).toEqual([{ field: 'name', message: 'Name is required' }]);
  });

  it('handles Mongoose duplicate key error (code 11000)', () => {
    const err = {
      code: 11000,
      keyPattern: { email: 1 },
    };
    const res = createMockRes();

    errorHandler(err, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.body.code).toBe('DUPLICATE_KEY');
    expect(res.body.message).toContain('already exists');
  });

  it('handles JWT token errors', () => {
    const err = { name: 'JsonWebTokenError', message: 'jwt malformed' };
    const res = createMockRes();

    errorHandler(err, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });

  it('handles generic unhandled error with safe 500 response', () => {
    const err = new Error('Database crash');
    const res = createMockRes();

    errorHandler(err, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('INTERNAL_ERROR');
    expect(res.body.message).toBe('An unexpected error occurred. Please try again later.');
  });

  it('notFoundHandler returns 404 with method and path', () => {
    const res = createMockRes();
    notFoundHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.body.code).toBe('NOT_FOUND');
    expect(res.body.message).toBe('Cannot GET /api/test');
  });
});
