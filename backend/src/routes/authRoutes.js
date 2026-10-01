import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { authLimiter, otpSendLimiter } from '../middleware/rateLimiter.js';
import {
  sendOtpValidator,
  verifyOtpValidator,
  userLoginValidator,
  refreshTokenValidator,
} from '../validators/authValidators.js';

const router = Router();

router.post('/customer/send-otp', otpSendLimiter, sendOtpValidator, validate, authController.sendOTP);
router.post('/customer/verify-otp', authLimiter, verifyOtpValidator, validate, authController.verifyOTP);
router.post('/staff/login', authLimiter, userLoginValidator, validate, authController.adminLogin);
router.post('/refresh-token', refreshTokenValidator, validate, authController.refreshToken);
router.post('/logout', authenticate, authController.logoutUser);
router.get('/me', authenticate, authController.getMe);

export default router;
