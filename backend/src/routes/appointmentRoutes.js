import { Router } from 'express';
import * as appointmentController from '../controllers/appointmentController.js';
import { authenticate, salonStaff } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createAppointmentValidator,
  updateStatusValidator,
  cancelAppointmentValidator,
  getSlotsValidator,
  submitReviewValidator,
} from '../validators/appointmentValidators.js';

const router = Router();

// Availability slots check (public or authenticated)
router.get('/availability', getSlotsValidator, validate, appointmentController.getSlots);

// Authenticated appointment endpoints
router.use(authenticate);

router.post('/', createAppointmentValidator, validate, appointmentController.create);
router.get('/', appointmentController.getAll);
router.get('/:id', appointmentController.getById);

// Salon staff updates status
router.patch('/:id/status', salonStaff, updateStatusValidator, validate, appointmentController.updateStatus);

// Cancellation & reviews
router.post('/:id/cancel', cancelAppointmentValidator, validate, appointmentController.cancel);
router.post('/:id/review', submitReviewValidator, validate, appointmentController.submitReview);

export default router;
