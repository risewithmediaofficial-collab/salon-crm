import { body, param, query } from 'express-validator';
import { APPOINTMENT_STATUS } from '../constants/index.js';
import { DATE_REGEX, TIME_REGEX } from '../../../shared/validation-rules/index.js';

export const createAppointmentValidator = [
  body('serviceId')
    .optional()
    .isMongoId()
    .withMessage('Valid serviceId is required'),
  body('serviceIds')
    .optional()
    .isArray({ min: 1 })
    .withMessage('serviceIds must be an array of service IDs'),
  body('serviceIds.*')
    .optional()
    .isMongoId()
    .withMessage('Each item in serviceIds must be a valid MongoId'),
  body().custom((val) => {
    if (!val.serviceId && (!val.serviceIds || val.serviceIds.length === 0)) {
      throw new Error('Either serviceId or serviceIds array is required');
    }
    return true;
  }),
  body('staffId')
    .isMongoId()
    .withMessage('Valid staffId is required'),
  body('appointmentDate')
    .matches(DATE_REGEX)
    .withMessage('appointmentDate must be in YYYY-MM-DD format'),
  body('startTime')
    .matches(TIME_REGEX)
    .withMessage('startTime must be in HH:mm 24-hour format'),
  body('notes')
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),
  body('offerCode')
    .optional()
    .trim()
    .isString()
    .isLength({ max: 30 }),
];

export const updateStatusValidator = [
  param('id')
    .isMongoId()
    .withMessage('Valid appointment ID is required'),
  body('status')
    .isIn(Object.values(APPOINTMENT_STATUS))
    .withMessage('Valid status is required'),
  body('reason')
    .optional()
    .isString()
    .isLength({ max: 500 }),
];

export const cancelAppointmentValidator = [
  param('id')
    .isMongoId()
    .withMessage('Valid appointment ID is required'),
  body('reason')
    .optional()
    .isString()
    .isLength({ max: 500 }),
];

export const getSlotsValidator = [
  query('staffId')
    .isMongoId()
    .withMessage('Valid staffId query parameter is required'),
  query('serviceId')
    .optional()
    .isMongoId()
    .withMessage('Valid serviceId query parameter is required'),
  query('serviceIds')
    .optional()
    .isString(),
  query().custom((val) => {
    if (!val.serviceId && !val.serviceIds) {
      throw new Error('Either serviceId or serviceIds query parameter is required');
    }
    return true;
  }),
  query('date')
    .matches(DATE_REGEX)
    .withMessage('Date must be in YYYY-MM-DD format'),
];

export const submitReviewValidator = [
  param('id')
    .isMongoId()
    .withMessage('Valid appointment ID is required'),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be an integer between 1 and 5'),
  body('comment')
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage('Comment cannot exceed 1000 characters'),
];
