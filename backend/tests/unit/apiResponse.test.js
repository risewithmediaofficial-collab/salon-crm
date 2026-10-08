import { describe, it, expect, jest } from '@jest/globals';
import {
  successResponse,
  createdResponse,
  errorResponse,
  getPagination,
  buildPaginationMeta,
} from '../../src/utils/apiResponse.js';

describe('API Response Utility Functions', () => {
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

  it('formats standard successResponse properly', () => {
    const res = createMockRes();
    successResponse(res, { message: 'Loaded', data: { id: 1 } });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.body).toEqual({
      success: true,
      message: 'Loaded',
      data: { id: 1 },
    });
  });

  it('formats createdResponse with status 201', () => {
    const res = createMockRes();
    createdResponse(res, { message: 'Item created', data: { id: 42 } });

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.body).toEqual({
      success: true,
      message: 'Item created',
      data: { id: 42 },
    });
  });

  it('formats errorResponse with status and custom code/errors', () => {
    const res = createMockRes();
    errorResponse(res, {
      statusCode: 400,
      message: 'Invalid input',
      code: 'BAD_REQUEST',
      errors: [{ field: 'email', message: 'Required' }],
    });

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.body).toEqual({
      success: false,
      message: 'Invalid input',
      code: 'BAD_REQUEST',
      errors: [{ field: 'email', message: 'Required' }],
    });
  });

  it('calculates getPagination correctly with query values and bounds', () => {
    // Normal query
    const normal = getPagination({ page: '2', limit: '15' });
    expect(normal).toEqual({ page: 2, limit: 15, skip: 15 });

    // Defaults when empty
    const defaults = getPagination({});
    expect(defaults).toEqual({ page: 1, limit: 20, skip: 0 });

    // Boundaries: negative or 0 page capped at 1, max limit capped at 100
    const bounded = getPagination({ page: '-5', limit: '200' });
    expect(bounded.page).toBe(1);
    expect(bounded.limit).toBe(100);
    expect(bounded.skip).toBe(0);
  });

  it('builds buildPaginationMeta properly', () => {
    const meta = buildPaginationMeta({ page: 2, limit: 10, total: 35 });
    expect(meta).toEqual({
      page: 2,
      limit: 10,
      total: 35,
      totalPages: 4,
      hasNextPage: true,
      hasPrevPage: true,
    });

    const firstPageMeta = buildPaginationMeta({ page: 1, limit: 10, total: 5 });
    expect(firstPageMeta.hasPrevPage).toBe(false);
    expect(firstPageMeta.hasNextPage).toBe(false);
  });
});
