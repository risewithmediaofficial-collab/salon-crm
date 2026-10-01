import { body, param } from 'express-validator';
import { OFFER_TYPE } from '../constants/index.js';

export const createOfferValidator = [
  body('title')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Title must be between 2 and 100 characters'),
  body('code')
    .trim()
    .isLength({ min: 3, max: 20 })
    .matches(/^[A-Za-z0-9_-]+$/)
    .withMessage('Code must be alphanumeric and 3-20 characters'),
  body('type')
    .isIn(Object.values(OFFER_TYPE))
    .withMessage('Valid offer type (PERCENTAGE or FLAT) is required'),
  body('value')
    .isFloat({ min: 0 })
    .withMessage('Value must be non-negative'),
  body('maxDiscountAmount')
    .optional({ nullable: true })
    .isFloat({ min: 0 }),
  body('minOrderAmount')
    .optional()
    .isFloat({ min: 0 }),
  body('applicableServices')
    .optional()
    .isArray(),
  body('startDate')
    .optional({ checkFalsy: true })
    .isISO8601(),
  body('endDate')
    .optional({ checkFalsy: true })
    .isISO8601(),
  body('usageLimit')
    .optional({ nullable: true })
    .isInt({ min: 1 }),
  body('isActive')
    .optional()
    .isBoolean(),
];

export const updateOfferValidator = [
  param('id')
    .isMongoId()
    .withMessage('Valid offer ID is required'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }),
  body('type')
    .optional()
    .isIn(Object.values(OFFER_TYPE)),
  body('value')
    .optional()
    .isFloat({ min: 0 }),
  body('maxDiscountAmount')
    .optional({ nullable: true })
    .isFloat({ min: 0 }),
  body('minOrderAmount')
    .optional()
    .isFloat({ min: 0 }),
  body('applicableServices')
    .optional()
    .isArray(),
  body('startDate')
    .optional({ checkFalsy: true })
    .isISO8601(),
  body('endDate')
    .optional({ checkFalsy: true })
    .isISO8601(),
  body('usageLimit')
    .optional({ nullable: true })
    .isInt({ min: 1 }),
  body('isActive')
    .optional()
    .isBoolean(),
];
