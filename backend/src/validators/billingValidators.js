import { body, param } from 'express-validator';
import { PAYMENT_METHOD } from '../constants/index.js';

export const recordPaymentValidator = [
  param('id')
    .isMongoId()
    .withMessage('Valid invoice ID is required'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('method')
    .isIn(Object.values(PAYMENT_METHOD))
    .withMessage('Valid payment method is required'),
  body('referenceNumber')
    .optional()
    .trim()
    .isString()
    .isLength({ max: 100 }),
  body('notes')
    .optional()
    .trim()
    .isString()
    .isLength({ max: 500 }),
];

export const validateOfferQueryValidator = [
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Offer code is required'),
  body('serviceId')
    .isMongoId()
    .withMessage('Valid service ID is required'),
];
