/**
 * billingService.js
 *
 * IMPORTANT: The backend is the SOLE source of truth for pricing.
 * The frontend NEVER sends price/tax/discount values.
 * All amounts are computed here from live DB data.
 */
import Invoice from '../models/Invoice.js';
import Service from '../models/Service.js';
import Offer from '../models/Offer.js';
import { INVOICE_STATUS, PAYMENT_METHOD, OFFER_TYPE, TAX_RATE } from '../constants/index.js';
import { AppError, NotFoundError } from '../utils/errors.js';
import logger from '../utils/logger.js';

/**
 * Generate a sequential invoice number: INV-YYYYMMDD-XXXX
 */
async function generateInvoiceNumber() {
  const today = new Date();
  const prefix = `INV-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
  const count = await Invoice.countDocuments({
    invoiceNumber: { $regex: `^${prefix}` },
  });
  return `${prefix}-${String(count + 1).padStart(4, '0')}`;
}

/**
 * Compute billing amounts from service + offer.
 * Returns a billing snapshot to be stored with the invoice.
 *
 * @param {object} service - Mongoose Service document
 * @param {object|null} offer - Mongoose Offer document or null
 * @returns {{ subtotal, taxRate, taxAmount, discountAmount, totalAmount, billingSnapshot }}
 */
export function computeBilling(service, offer = null) {
  const subtotal = service.price;
  const effectiveTaxRate = service.taxRate !== null ? service.taxRate : TAX_RATE;

  let discountAmount = 0;
  if (offer) {
    if (offer.type === OFFER_TYPE.PERCENTAGE) {
      const rawDiscount = subtotal * (offer.value / 100);
      discountAmount = offer.maxDiscountAmount
        ? Math.min(rawDiscount, offer.maxDiscountAmount)
        : rawDiscount;
    } else if (offer.type === OFFER_TYPE.FLAT) {
      discountAmount = Math.min(offer.value, subtotal);
    }
    discountAmount = Math.round(discountAmount * 100) / 100;
  }

  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = Math.round(taxableAmount * effectiveTaxRate * 100) / 100;
  const totalAmount = Math.round((taxableAmount + taxAmount) * 100) / 100;

  return {
    subtotal,
    taxRate: effectiveTaxRate,
    taxAmount,
    discountAmount,
    totalAmount,
    billingSnapshot: {
      serviceName: service.name,
      servicePrice: service.price,
      taxRate: effectiveTaxRate,
      taxAmount,
      discountAmount,
      totalAmount,
    },
  };
}

/**
 * Validate and retrieve an offer for use in billing.
 * Throws if offer is invalid, expired, or over usage limit.
 *
 * @param {string} offerCode
 * @param {string} serviceId
 * @param {number} subtotal
 * @returns {Promise<object|null>}
 */
export async function validateOffer(offerCode, serviceId, subtotal) {
  if (!offerCode) return null;

  const offer = await Offer.findOne({
    code: offerCode.toUpperCase(),
    isActive: true,
  }).lean();

  if (!offer) throw new AppError('Invalid or expired offer code', 400, 'INVALID_OFFER');

  const now = new Date();
  if (offer.startDate && now < offer.startDate) {
    throw new AppError('This offer is not yet active', 400, 'OFFER_NOT_STARTED');
  }
  if (offer.endDate && now > offer.endDate) {
    throw new AppError('This offer has expired', 400, 'OFFER_EXPIRED');
  }
  if (offer.usageLimit !== null && offer.usageCount >= offer.usageLimit) {
    throw new AppError('This offer has reached its usage limit', 400, 'OFFER_LIMIT_REACHED');
  }
  if (subtotal < offer.minOrderAmount) {
    throw new AppError(`Minimum order amount for this offer is ₹${offer.minOrderAmount}`, 400, 'OFFER_MIN_AMOUNT');
  }
  if (offer.applicableServices.length > 0) {
    const applicable = offer.applicableServices.some((s) => String(s) === String(serviceId));
    if (!applicable) {
      throw new AppError('This offer is not applicable for the selected service', 400, 'OFFER_NOT_APPLICABLE');
    }
  }

  return offer;
}

/**
 * Create a draft invoice for an appointment.
 * Called after appointment is created.
 *
 * @param {object} params
 * @param {object} params.appointment - Appointment document
 * @param {object} params.service - Service document
 * @param {object|null} params.offer
 * @param {string} params.customerId
 * @returns {Promise<object>} Invoice document
 */
export async function createDraftInvoice({ appointment, service, offer, customerId }) {
  const billing = computeBilling(service, offer);
  const invoiceNumber = await generateInvoiceNumber();

  const invoice = await Invoice.create({
    invoiceNumber,
    customer: customerId,
    appointment: appointment._id,
    lineItems: [
      {
        description: service.name,
        quantity: 1,
        unitPrice: service.price,
        taxRate: billing.taxRate,
        taxAmount: billing.taxAmount,
        discountAmount: billing.discountAmount,
        total: billing.totalAmount,
      },
    ],
    subtotal: billing.subtotal,
    totalTax: billing.taxAmount,
    totalDiscount: billing.discountAmount,
    totalAmount: billing.totalAmount,
    amountPaid: 0,
    amountDue: billing.totalAmount,
    status: INVOICE_STATUS.DRAFT,
  });

  // Increment offer usage
  if (offer) {
    await Offer.findByIdAndUpdate(offer._id, { $inc: { usageCount: 1 } });
  }

  return invoice;
}

/**
 * Issue an invoice (DRAFT → ISSUED)
 */
export async function issueInvoice(invoiceId) {
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) throw new NotFoundError('Invoice');
  if (invoice.status !== INVOICE_STATUS.DRAFT) {
    throw new AppError('Invoice is not in DRAFT status', 400, 'INVALID_INVOICE_STATUS');
  }
  invoice.status = INVOICE_STATUS.ISSUED;
  invoice.issuedAt = new Date();
  await invoice.save();
  return invoice;
}

/**
 * Record a payment against an invoice.
 * @param {string} invoiceId
 * @param {{ amount: number, method: string, referenceNumber?: string, notes?: string }} paymentData
 */
export async function recordPayment(invoiceId, paymentData) {
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) throw new NotFoundError('Invoice');
  if (invoice.status === INVOICE_STATUS.PAID) {
    throw new AppError('Invoice is already fully paid', 400, 'ALREADY_PAID');
  }
  if (invoice.status === INVOICE_STATUS.CANCELLED) {
    throw new AppError('Cannot record payment for a cancelled invoice', 400, 'INVOICE_CANCELLED');
  }
  if (!Object.values(PAYMENT_METHOD).includes(paymentData.method)) {
    throw new AppError('Invalid payment method', 400, 'INVALID_PAYMENT_METHOD');
  }
  if (paymentData.amount <= 0 || paymentData.amount > invoice.amountDue) {
    throw new AppError(`Payment amount must be between 0 and ₹${invoice.amountDue}`, 400, 'INVALID_AMOUNT');
  }

  invoice.payments.push({
    amount: paymentData.amount,
    method: paymentData.method,
    referenceNumber: paymentData.referenceNumber,
    notes: paymentData.notes,
    paidAt: new Date(),
  });

  invoice.amountPaid = Math.round((invoice.amountPaid + paymentData.amount) * 100) / 100;
  invoice.amountDue = Math.round((invoice.totalAmount - invoice.amountPaid) * 100) / 100;

  if (invoice.amountDue <= 0) {
    invoice.status = INVOICE_STATUS.PAID;
    invoice.amountDue = 0;
  } else {
    invoice.status = INVOICE_STATUS.PARTIALLY_PAID;
  }

  await invoice.save();
  return invoice;
}

/**
 * Query invoices with filters, pagination, and role-based access control
 */
export async function getInvoices({ query, userRole, userId }) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const filter = {};

  if (userRole === 'CUSTOMER') {
    filter.customer = userId;
  } else if (query.customerId) {
    filter.customer = query.customerId;
  }

  if (query.status) {
    filter.status = query.status;
  }

  if (query.startDate && query.endDate) {
    filter.createdAt = {
      $gte: new Date(query.startDate),
      $lte: new Date(query.endDate),
    };
  }

  const [invoices, total] = await Promise.all([
    Invoice.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('customer', 'name phone email')
      .populate('appointment', 'appointmentDate startTime')
      .lean(),
    Invoice.countDocuments(filter),
  ]);

  return {
    invoices,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  };
}

export async function getInvoiceById(id, { userRole, userId }) {
  const invoice = await Invoice.findById(id)
    .populate('customer', 'name phone email')
    .populate('appointment')
    .lean();

  if (!invoice) throw new NotFoundError('Invoice');

  if (userRole === 'CUSTOMER' && String(invoice.customer._id) !== String(userId)) {
    throw new AppError('Access denied', 403, 'FORBIDDEN');
  }

  return invoice;
}

