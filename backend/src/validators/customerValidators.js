import { body, param } from 'express-validator';
import { PHONE_REGEX } from '../../../shared/validation-rules/index.js';

export const updateCustomerValidator = [
  param('id')
    .isMongoId()
    .withMessage('Valid customer ID is required'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be 2 to 100 characters'),
  body('email')
    .optional({ checkFalsy: true })
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('phone')
    .optional()
    .matches(PHONE_REGEX)
    .withMessage('Phone must be a valid 10-digit mobile number'),
  body('gender')
    .optional()
    .isIn(['FEMALE', 'MALE', 'OTHER', 'PREFER_NOT_TO_SAY']),
  body('dateOfBirth')
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),
  body('address')
    .optional()
    .isObject(),
  body('notes')
    .optional()
    .isString()
    .isLength({ max: 2000 }),
];

export const createCustomerAdminValidator = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be 2 to 100 characters'),
  body('phone')
    .matches(PHONE_REGEX)
    .withMessage('Phone must be a valid 10-digit mobile number'),
  body('email')
    .optional({ checkFalsy: true })
    .trim()
    .isEmail()
    .normalizeEmail(),
  body('gender')
    .optional()
    .isIn(['FEMALE', 'MALE', 'OTHER', 'PREFER_NOT_TO_SAY']),
  body('notes')
    .optional()
    .isString()
    .isLength({ max: 2000 }),
];
