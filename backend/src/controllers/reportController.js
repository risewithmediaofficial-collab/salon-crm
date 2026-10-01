import * as reportService from '../services/reportService.js';
import { successResponse } from '../utils/apiResponse.js';

export async function getRevenue(req, res, next) {
  try {
    const data = await reportService.getRevenueReport(req.query);
    return successResponse(res, { data });
  } catch (err) {
    next(err);
  }
}

export async function getStaffPerformance(req, res, next) {
  try {
    const data = await reportService.getStaffPerformanceReport(req.query);
    return successResponse(res, { data });
  } catch (err) {
    next(err);
  }
}

export async function getTopServices(req, res, next) {
  try {
    const data = await reportService.getTopServicesReport(req.query);
    return successResponse(res, { data });
  } catch (err) {
    next(err);
  }
}

export async function getCustomerGrowth(req, res, next) {
  try {
    const data = await reportService.getCustomerGrowthReport(req.query);
    return successResponse(res, { data });
  } catch (err) {
    next(err);
  }
}
