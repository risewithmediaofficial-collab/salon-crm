import * as billingService from '../services/billingService.js';
import Service from '../models/Service.js';
import { successResponse } from '../utils/apiResponse.js';

export async function getAll(req, res, next) {
  try {
    const result = await billingService.getInvoices({
      query: req.query,
      userRole: req.user.role,
      userId: req.user.id,
    });

    return successResponse(res, {
      data: result.invoices,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
}

export async function getById(req, res, next) {
  try {
    const invoice = await billingService.getInvoiceById(req.params.id, {
      userRole: req.user.role,
      userId: req.user.id,
    });

    return successResponse(res, { data: invoice });
  } catch (err) {
    next(err);
  }
}

export async function pay(req, res, next) {
  try {
    const invoice = await billingService.recordPayment(req.params.id, req.body);
    return successResponse(res, {
      message: 'Payment recorded successfully',
      data: invoice,
    });
  } catch (err) {
    next(err);
  }
}

export async function issue(req, res, next) {
  try {
    const invoice = await billingService.issueInvoice(req.params.id);
    return successResponse(res, {
      message: 'Invoice issued successfully',
      data: invoice,
    });
  } catch (err) {
    next(err);
  }
}

export async function validateOffer(req, res, next) {
  try {
    const { code, serviceId } = req.body;
    const service = await Service.findById(serviceId).lean();
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    const offer = await billingService.validateOffer(code, serviceId, service.price);
    const { discountAmount, totalAmount } = billingService.computeBilling(service, offer);

    return successResponse(res, {
      data: {
        offer,
        originalPrice: service.price,
        discountAmount,
        finalPrice: totalAmount,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function createPos(req, res, next) {
  try {
    const invoice = await billingService.createPosInvoice({
      ...req.body,
      cashierId: req.user.id,
    });

    return successResponse(res, {
      message: 'POS bill generated and recorded successfully',
      data: invoice,
    });
  } catch (err) {
    next(err);
  }
}

