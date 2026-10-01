import { body, param } from 'express-validator';
import { SERVICE_CATEGORY } from '../constants/index.js';

export const createServiceValidator = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Service name must be between 2 and 100 characters'),
  body('category')
    .isIn(Object.values(SERVICE_CATEGORY))
    .withMessage('Valid service category is required'),
  body('duration')
    .isInt({ min: 5, max: 480 })
    .withMessage('Duration must be between 5 and 480 minutes'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a non-negative number'),
  body('bufferTime')
    .optional()
    .isInt({ min: 0, max: 60 }),
  body('taxRate')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0, max: 1 }),
  body('description')
    .optional()
    .isString()
    .isLength({ max: 500 }),
  body('isActive')
    .optional()
    .isBoolean(),
  body('imageUrl')
    .optional()
    .isString(),
];

export const updateServiceValidator = [
  param('id')
    .isMongoId()
    .withMessage('Valid service ID is required'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }),
  body('category')
    .optional()
    .isIn(Object.values(SERVICE_CATEGORY)),
  body('duration')
    .optional()
    .isInt({ min: 5, max: 480 }),
  body('price')
    .optional()
    .isFloat({ min: 0 }),
  body('bufferTime')
    .optional()
    .isInt({ min: 0, max: 60 }),
  body('taxRate')
    .optional({ nullable: true })
    .isFloat({ min: 0, max: 1 }),
  body('description')
    .optional()
    .isString()
    .isLength({ max: 500 }),
  body('isActive')
    .optional()
    .isBoolean(),
  body('imageUrl')
    .optional()
    .isString(),
];
