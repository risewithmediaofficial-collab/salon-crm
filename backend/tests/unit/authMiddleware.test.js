import { describe, it, expect, jest } from '@jest/globals';
import {
  authorize,
  adminOnly,
  salonStaff,
  customerOwnsResource,
} from '../../src/middleware/auth.js';
import { ROLES } from '../../src/constants/index.js';
import { ForbiddenError, UnauthorizedError } from '../../src/utils/errors.js';

describe('Auth Middleware Unit Tests', () => {
  it('authorize passes when user has allowed role', () => {
    const middleware = authorize(ROLES.OWNER, ROLES.MANAGER);
    const req = { user: { role: ROLES.OWNER } };
    const next = jest.fn();

    middleware(req, {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('authorize passes UnauthorizedError when req.user is absent', () => {
    const middleware = authorize(ROLES.OWNER);
    const req = {};
    const next = jest.fn();

    middleware(req, {}, next);
    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
  });

  it('authorize passes ForbiddenError when user has unauthorized role', () => {
    const middleware = authorize(ROLES.OWNER);
    const req = { user: { role: ROLES.STAFF } };
    const next = jest.fn();

    middleware(req, {}, next);
    expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
  });

  it('adminOnly allows OWNER and MANAGER but rejects STAFF and CUSTOMER', () => {
    const next = jest.fn();

    // Owner allowed
    adminOnly({ user: { role: ROLES.OWNER } }, {}, next);
    expect(next).toHaveBeenLastCalledWith();

    // Manager allowed
    adminOnly({ user: { role: ROLES.MANAGER } }, {}, next);
    expect(next).toHaveBeenLastCalledWith();

    // Staff rejected
    adminOnly({ user: { role: ROLES.STAFF } }, {}, next);
    expect(next).toHaveBeenLastCalledWith(expect.any(ForbiddenError));

    // Customer rejected
    adminOnly({ user: { role: ROLES.CUSTOMER } }, {}, next);
    expect(next).toHaveBeenLastCalledWith(expect.any(ForbiddenError));
  });

  it('salonStaff allows OWNER, MANAGER, STAFF but rejects CUSTOMER', () => {
    const next = jest.fn();

    salonStaff({ user: { role: ROLES.STAFF } }, {}, next);
    expect(next).toHaveBeenLastCalledWith();

    salonStaff({ user: { role: ROLES.CUSTOMER } }, {}, next);
    expect(next).toHaveBeenLastCalledWith(expect.any(ForbiddenError));
  });

  it('customerOwnsResource allows owner matching resource ID and rejects mismatch', () => {
    const getCustomerId = (req) => req.params.customerId;
    const middleware = customerOwnsResource(getCustomerId);

    // Matching customer
    const reqMatching = { user: { id: 'cust123', role: ROLES.CUSTOMER }, params: { customerId: 'cust123' } };
    const nextMatching = jest.fn();
    middleware(reqMatching, {}, nextMatching);
    expect(nextMatching).toHaveBeenCalledWith();

    // Mismatched customer
    const reqMismatched = { user: { id: 'cust123', role: ROLES.CUSTOMER }, params: { customerId: 'otherCust' } };
    const nextMismatched = jest.fn();
    middleware(reqMismatched, {}, nextMismatched);
    expect(nextMismatched).toHaveBeenCalledWith(expect.any(ForbiddenError));

    // Non-customer (e.g. staff/admin) can access regardless of id
    const reqStaff = { user: { id: 'staff99', role: ROLES.STAFF }, params: { customerId: 'otherCust' } };
    const nextStaff = jest.fn();
    middleware(reqStaff, {}, nextStaff);
    expect(nextStaff).toHaveBeenCalledWith();
  });
});
