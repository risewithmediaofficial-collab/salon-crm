import { Router } from 'express';
import * as reportController from '../controllers/reportController.js';
import { authenticate, adminOnly } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, adminOnly);

router.get('/revenue', reportController.getRevenue);
router.get('/staff-performance', reportController.getStaffPerformance);
router.get('/top-services', reportController.getTopServices);
router.get('/customer-growth', reportController.getCustomerGrowth);

export default router;
