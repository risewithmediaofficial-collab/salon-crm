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

// Database initialization / seeding endpoint
router.all('/seed', async (_req, res, next) => {
  try {
    const { seedDatabase } = await import('../config/seed.js');
    await seedDatabase();
    return res.status(200).json({
      success: true,
      message: 'Database seeded successfully with initial admin, staff, and services.',
      credentials: {
        admin: 'admin@salon.com / Admin@Salon2026!',
        staff: 'priya@salon.com / Staff@Salon2026!',
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
