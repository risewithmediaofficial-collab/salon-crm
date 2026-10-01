import { Router } from 'express';
import * as auditController from '../controllers/auditController.js';
import { authenticate, adminOnly } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, adminOnly);

router.get('/', auditController.getAll);

export default router;
