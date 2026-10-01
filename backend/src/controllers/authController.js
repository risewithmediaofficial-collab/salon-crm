import { sendCustomerOTP, verifyCustomerOTP, loginUser, refreshAccessToken, logout } from '../services/authService.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import { ROLES } from '../constants/index.js';

export async function sendOTP(req, res, next) {
  try {
    const { phone, name } = req.body;
    const result = await sendCustomerOTP(phone, name);
    return successResponse(res, { message: result.message, data: { phoneLastFour: result.phoneLastFour } });
  } catch (err) { next(err); }
}

export async function verifyOTP(req, res, next) {
  try {
    const { phone, otp } = req.body;
    const result = await verifyCustomerOTP(phone, otp);
    return successResponse(res, { message: 'Login successful', data: result });
  } catch (err) { next(err); }
}

export async function adminLogin(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await loginUser(email, password);
    return successResponse(res, { message: 'Login successful', data: result });
  } catch (err) { next(err); }
}

export async function refreshToken(req, res, next) {
  try {
    const { refreshToken, isCustomer } = req.body;
    const tokens = await refreshAccessToken(refreshToken, isCustomer);
    return successResponse(res, { message: 'Token refreshed', data: tokens });
  } catch (err) { next(err); }
}

export async function logoutUser(req, res, next) {
  try {
    const isCustomer = req.user.role === ROLES.CUSTOMER;
    await logout(req.user.id, isCustomer);
    return successResponse(res, { message: 'Logged out successfully' });
  } catch (err) { next(err); }
}

export async function getMe(req, res, next) {
  try {
    return successResponse(res, { data: req.user });
  } catch (err) { next(err); }
}
