import Offer from '../models/Offer.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';
import { recordAudit } from './auditService.js';
import { AUDIT_ACTION } from '../constants/index.js';

export async function getOffers({ query = {} }) {
  const filter = {};
  if (query.activeOnly !== 'false') {
    filter.isActive = true;
    const now = new Date();
    filter.$or = [
      { endDate: null },
      { endDate: { $gte: now } },
    ];
  }

  return Offer.find(filter)
    .populate('applicableServices', 'name price')
    .sort({ createdAt: -1 })
    .lean();
}

export async function getOfferById(id) {
  const offer = await Offer.findById(id)
    .populate('applicableServices', 'name price')
    .lean();
  if (!offer) throw new NotFoundError('Offer');
  return offer;
}

export async function createOffer(data, actorId) {
  const existing = await Offer.findOne({ code: data.code.toUpperCase() });
  if (existing) {
    throw new ConflictError('An offer with this promo code already exists');
  }

  const offer = await Offer.create({
    ...data,
    code: data.code.toUpperCase(),
  });

  await recordAudit({
    action: AUDIT_ACTION.OFFER_CREATED,
    performedBy: actorId,
    performedByModel: 'User',
    entityType: 'Offer',
    entityId: offer._id,
    description: `Created offer "${offer.title}" (${offer.code})`,
  });

  return offer;
}

export async function updateOffer(id, data, actorId) {
  const offer = await Offer.findById(id);
  if (!offer) throw new NotFoundError('Offer');

  if (data.code && data.code.toUpperCase() !== offer.code) {
    const existing = await Offer.findOne({ code: data.code.toUpperCase(), _id: { $ne: id } });
    if (existing) throw new ConflictError('An offer with this promo code already exists');
    data.code = data.code.toUpperCase();
  }

  Object.assign(offer, data);
  await offer.save();

  await recordAudit({
    action: AUDIT_ACTION.OFFER_UPDATED,
    performedBy: actorId,
    performedByModel: 'User',
    entityType: 'Offer',
    entityId: offer._id,
    description: `Updated offer "${offer.title}" (${offer.code})`,
  });

  return offer;
}

export async function deleteOffer(id, actorId) {
  const offer = await Offer.findById(id);
  if (!offer) throw new NotFoundError('Offer');

  offer.isActive = false;
  await offer.save();

  return offer;
}
