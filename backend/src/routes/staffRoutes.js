import { Router } from 'express';
import * as staffController from '../controllers/staffController.js';
import { authenticate, adminOnly } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createStaffValidator,
  updateStaffValidator,
  addLeaveValidator,
} from '../validators/staffValidators.js';

const router = Router();

// Staff list is viewable by customers to choose a preferred staff
router.get('/', staffController.getAll);
router.get('/:id', staffController.getById);

// Admin-only management endpoints
router.post('/', authenticate, adminOnly, createStaffValidator, validate, staffController.create);
router.patch('/:id', authenticate, adminOnly, updateStaffValidator, validate, staffController.update);
router.post('/:id/leaves', authenticate, adminOnly, addLeaveValidator, validate, staffController.addLeave);
router.delete('/:id/leaves/:leaveId', authenticate, adminOnly, staffController.removeLeave);
router.delete('/:id', authenticate, adminOnly, staffController.remove);

export default router;
