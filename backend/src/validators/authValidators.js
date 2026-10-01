import { body } from 'express-validator';
import { PHONE_REGEX } from '../../../shared/validation-rules/index.js';

export const sendOtpValidator = [
  body('phone')
    .trim()
    .matches(PHONE_REGEX)
    .withMessage('Must be a valid 10-digit Indian mobile number'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
];

export const verifyOtpValidator = [
  body('phone')
    .trim()
    .matches(PHONE_REGEX)
    .withMessage('Must be a valid 10-digit Indian mobile number'),
  body('otp')
    .trim()
    .isLength({ min: 4, max: 6 })
    .isNumeric()
    .withMessage('OTP must be a 4-6 digit numeric code'),
];

export const userLoginValidator = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isString()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];

export const refreshTokenValidator = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required'),
];
