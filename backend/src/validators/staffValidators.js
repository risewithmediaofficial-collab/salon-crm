import { body, param } from 'express-validator';
import { TIME_REGEX } from '../../../shared/validation-rules/index.js';

export const createStaffValidator = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('phone')
    .optional()
    .trim()
    .isLength({ min: 10, max: 15 }),
  body('role')
    .optional()
    .isIn(['STAFF', 'MANAGER']),
  body('services')
    .optional()
    .isArray()
    .withMessage('Services must be an array of service IDs'),
  body('workingHours')
    .optional()
    .isArray(),
  body('bio')
    .optional()
    .isString()
    .isLength({ max: 300 }),
];

export const updateStaffValidator = [
  param('id')
    .isMongoId()
    .withMessage('Valid staff ID is required'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }),
  body('phone')
    .optional()
    .trim()
    .isLength({ min: 10, max: 15 }),
  body('bio')
    .optional()
    .isString()
    .isLength({ max: 300 }),
  body('services')
    .optional()
    .isArray(),
  body('isActive')
    .optional()
    .isBoolean(),
  body('workingHours')
    .optional()
    .isArray(),
];

export const addLeaveValidator = [
  param('id')
    .isMongoId()
    .withMessage('Valid staff ID is required'),
  body('startDate')
    .isISO8601()
    .withMessage('Valid startDate is required'),
  body('endDate')
    .isISO8601()
    .withMessage('Valid endDate is required'),
  body('reason')
    .optional()
    .isString()
    .isLength({ max: 200 }),
];
