import { Router } from 'express';
import * as billingController from '../controllers/billingController.js';
import { authenticate, salonStaff } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  recordPaymentValidator,
  validateOfferQueryValidator,
} from '../validators/billingValidators.js';

const router = Router();

router.use(authenticate);

// Offer validation for pricing preview
router.post('/validate-offer', validateOfferQueryValidator, validate, billingController.validateOffer);

// Invoices
router.get('/', billingController.getAll);
router.get('/:id', billingController.getById);

// Staff billing operations
router.post('/:id/pay', salonStaff, recordPaymentValidator, validate, billingController.pay);
router.post('/:id/issue', salonStaff, billingController.issue);

export default router;
