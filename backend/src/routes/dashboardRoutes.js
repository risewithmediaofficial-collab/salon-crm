import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboardController.js';
import { authenticate, salonStaff } from '../middleware/auth.js';

const router = Router();

router.get('/stats', authenticate, salonStaff, getDashboardStats);

export default router;
