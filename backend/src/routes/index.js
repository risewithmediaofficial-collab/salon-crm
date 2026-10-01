import { Router } from 'express';
import authRoutes from './authRoutes.js';
import appointmentRoutes from './appointmentRoutes.js';
import customerRoutes from './customerRoutes.js';
import serviceRoutes from './serviceRoutes.js';
import staffRoutes from './staffRoutes.js';
import billingRoutes from './billingRoutes.js';
import offerRoutes from './offerRoutes.js';
import reportRoutes from './reportRoutes.js';
import auditRoutes from './auditRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import notificationRoutes from './notificationRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/customers', customerRoutes);
router.use('/services', serviceRoutes);
router.use('/staff', staffRoutes);
router.use('/billing', billingRoutes);
router.use('/offers', offerRoutes);
router.use('/reports', reportRoutes);
router.use('/audit', auditRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/notifications', notificationRoutes);

export default router;
