import Service from '../models/Service.js';
import { NotFoundError } from '../utils/errors.js';
import { recordAudit } from './auditService.js';
import { AUDIT_ACTION, SERVICE_CATEGORY } from '../constants/index.js';

export async function getServices({ query = {} }) {
  const filter = {};

  if (query.activeOnly !== 'false') {
    filter.isActive = true;
  }
  if (query.category) {
    filter.category = query.category;
  }
  if (query.search) {
    const s = query.search.trim();
    filter.$or = [
      { name: { $regex: s, $options: 'i' } },
      { description: { $regex: s, $options: 'i' } },
    ];
  }

  return Service.find(filter).sort({ sortOrder: 1, name: 1 }).lean();
}

export async function getServiceById(id) {
  const service = await Service.findById(id).lean();
  if (!service) throw new NotFoundError('Service');
  return service;
}

export async function createService(data, actorId) {
  const service = await Service.create(data);

  await recordAudit({
    action: AUDIT_ACTION.SERVICE_CREATED,
    performedBy: actorId,
    performedByModel: 'User',
    entityType: 'Service',
    entityId: service._id,
    description: `Created service "${service.name}" (₹${service.price}, ${service.duration} mins)`,
  });

  return service;
}

export async function updateService(id, data, actorId) {
  const service = await Service.findById(id);
  if (!service) throw new NotFoundError('Service');

  const oldPrice = service.price;
  Object.assign(service, data);
  await service.save();

  let desc = `Updated service "${service.name}"`;
  if (data.price && data.price !== oldPrice) {
    desc += ` — price changed from ₹${oldPrice} to ₹${data.price}`;
  }

  await recordAudit({
    action: AUDIT_ACTION.SERVICE_UPDATED,
    performedBy: actorId,
    performedByModel: 'User',
    entityType: 'Service',
    entityId: service._id,
    description: desc,
  });

  return service;
}

export async function deleteService(id, actorId) {
  const service = await Service.findById(id);
  if (!service) throw new NotFoundError('Service');

  // Soft delete preserves historical appointments & billing integrity
  service.isActive = false;
  await service.save();

  await recordAudit({
    action: AUDIT_ACTION.SERVICE_DELETED,
    performedBy: actorId,
    performedByModel: 'User',
    entityType: 'Service',
    entityId: service._id,
    description: `Deactivated service "${service.name}"`,
  });

  return service;
}

export async function getCategories() {
  const counts = await Service.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);

  const countMap = Object.fromEntries(counts.map((c) => [c._id, c.count]));

  return Object.values(SERVICE_CATEGORY).map((cat) => ({
    category: cat,
    activeCount: countMap[cat] || 0,
  }));
}
