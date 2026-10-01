import { Router } from 'express';
import * as offerController from '../controllers/offerController.js';
import { authenticate, adminOnly } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createOfferValidator,
  updateOfferValidator,
} from '../validators/offerValidators.js';

const router = Router();

// Public / customer can view active offers
router.get('/', offerController.getAll);
router.get('/:id', offerController.getById);

// Admin-only management endpoints
router.post('/', authenticate, adminOnly, createOfferValidator, validate, offerController.create);
router.patch('/:id', authenticate, adminOnly, updateOfferValidator, validate, offerController.update);
router.delete('/:id', authenticate, adminOnly, offerController.remove);

export default router;
