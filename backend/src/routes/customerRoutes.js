import { Router } from 'express';
import * as customerController from '../controllers/customerController.js';
import { authenticate, salonStaff } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createCustomerAdminValidator,
  updateCustomerValidator,
} from '../validators/customerValidators.js';

const router = Router();

router.use(authenticate);

router.get('/profile', customerController.getProfile);
router.get('/', salonStaff, customerController.getAll);
router.post('/', salonStaff, createCustomerAdminValidator, validate, customerController.createAdmin);
router.get('/:id', customerController.getById);
router.patch('/:id', updateCustomerValidator, validate, customerController.update);

export default router;
