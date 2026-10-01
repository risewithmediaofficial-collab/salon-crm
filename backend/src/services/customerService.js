import Customer from '../models/Customer.js';
import Appointment from '../models/Appointment.js';
import Invoice from '../models/Invoice.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';
import { getPagination, buildPaginationMeta } from '../utils/apiResponse.js';
import { recordAudit } from './auditService.js';
import { AUDIT_ACTION } from '../constants/index.js';

export async function getCustomers({ query }) {
  const { page, limit, skip } = getPagination(query);
  const filter = { isActive: true };

  if (query.search) {
    const s = query.search.trim();
    filter.$or = [
      { name: { $regex: s, $options: 'i' } },
      { phone: { $regex: s, $options: 'i' } },
      { email: { $regex: s, $options: 'i' } },
    ];
  }

  const [customers, total] = await Promise.all([
    Customer.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Customer.countDocuments(filter),
  ]);

  return {
    customers,
    pagination: buildPaginationMeta({ page, limit, total }),
  };
}

export async function getCustomerById(id) {
  const customer = await Customer.findById(id).lean();
  if (!customer) throw new NotFoundError('Customer');

  const [recentAppointments, recentInvoices] = await Promise.all([
    Appointment.find({ customer: id })
      .sort({ appointmentDate: -1, startTime: -1 })
      .limit(5)
      .populate('service', 'name price')
      .populate('staff', 'name')
      .lean(),
    Invoice.find({ customer: id })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
  ]);

  return {
    ...customer,
    recentAppointments,
    recentInvoices,
  };
}

export async function createCustomerAdmin(data, actorId) {
  const existing = await Customer.findOne({ phone: data.phone });
  if (existing) {
    throw new ConflictError('A customer with this phone number already exists');
  }

  const customer = await Customer.create({
    ...data,
    isActive: true,
  });

  await recordAudit({
    action: AUDIT_ACTION.CUSTOMER_UPDATED,
    performedBy: actorId,
    performedByModel: 'User',
    entityType: 'Customer',
    entityId: customer._id,
    description: `Created new customer ${customer.name} (${customer.phone})`,
  });

  return customer;
}

export async function updateCustomer(id, data, actorId) {
  const customer = await Customer.findById(id);
  if (!customer) throw new NotFoundError('Customer');

  if (data.phone && data.phone !== customer.phone) {
    const conflict = await Customer.findOne({ phone: data.phone, _id: { $ne: id } });
    if (conflict) throw new ConflictError('Another customer with this phone already exists');
  }

  Object.assign(customer, data);
  await customer.save();

  await recordAudit({
    action: AUDIT_ACTION.CUSTOMER_UPDATED,
    performedBy: actorId,
    performedByModel: 'User',
    entityType: 'Customer',
    entityId: customer._id,
    description: `Updated customer details for ${customer.name}`,
  });

  return customer;
}
