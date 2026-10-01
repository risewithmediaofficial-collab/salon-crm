import jwt from 'jsonwebtoken';
import env from '../config/environment.js';
import User from '../models/User.js';
import Customer from '../models/Customer.js';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';
import { ROLES } from '../constants/index.js';

/**
 * Extract and verify the access token from Authorization header.
 * Sets req.user = { id, role, model } on success.
 */
export async function authenticate(req, _res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authentication required');
    }

    const token = authHeader.slice(7);
    let payload;
    try {
      payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
    } catch {
      throw new UnauthorizedError('Invalid or expired token');
    }

    // Load user from DB to check isActive
    let actor;
    if (payload.role === ROLES.CUSTOMER) {
      actor = await Customer.findById(payload.sub).select('+isActive').lean();
    } else {
      actor = await User.findById(payload.sub).select('+isActive').lean();
    }

    if (!actor || !actor.isActive) {
      throw new UnauthorizedError('Account not found or deactivated');
    }

    req.user = {
      id: payload.sub,
      role: payload.role,
      model: payload.role === ROLES.CUSTOMER ? 'Customer' : 'User',
    };

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Role-based authorization — call after authenticate()
 * @param {...string} allowedRoles
 */
export function authorize(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError());
    }
    next();
  };
}

/**
 * Convenience — must be admin (OWNER or MANAGER)
 */
export function adminOnly(req, res, next) {
  return authorize(ROLES.OWNER, ROLES.MANAGER)(req, res, next);
}

/**
 * Convenience — salon staff (OWNER, MANAGER, STAFF)
 */
export function salonStaff(req, res, next) {
  return authorize(ROLES.OWNER, ROLES.MANAGER, ROLES.STAFF)(req, res, next);
}

/**
 * Customer must be the owner of the resource being accessed.
 * Usage: customerOwnsResource(req => req.params.customerId)
 */
export function customerOwnsResource(getResourceCustomerId) {
  return (req, _res, next) => {
    if (req.user.role !== ROLES.CUSTOMER) return next(); // staff can access
    const resourceCustomerId = getResourceCustomerId(req);
    if (String(req.user.id) !== String(resourceCustomerId)) {
      return next(new ForbiddenError());
    }
    next();
  };
}
