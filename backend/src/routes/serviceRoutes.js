import { Router } from 'express';
import * as serviceController from '../controllers/serviceController.js';
import { authenticate, adminOnly } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createServiceValidator,
  updateServiceValidator,
} from '../validators/serviceValidators.js';

const router = Router();

// Public routes for customer booking portal
router.get('/', serviceController.getAll);
router.get('/categories', serviceController.getCategories);
router.get('/:id', serviceController.getById);

// Admin-protected routes
router.post('/', authenticate, adminOnly, createServiceValidator, validate, serviceController.create);
router.patch('/:id', authenticate, adminOnly, updateServiceValidator, validate, serviceController.update);
router.delete('/:id', authenticate, adminOnly, serviceController.remove);

export default router;
