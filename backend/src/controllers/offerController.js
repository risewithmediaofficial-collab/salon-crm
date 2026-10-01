import * as offerService from '../services/offerService.js';
import { successResponse, createdResponse } from '../utils/apiResponse.js';

export async function getAll(req, res, next) {
  try {
    const offers = await offerService.getOffers({ query: req.query });
    return successResponse(res, { data: offers });
  } catch (err) {
    next(err);
  }
}

export async function getById(req, res, next) {
  try {
    const offer = await offerService.getOfferById(req.params.id);
    return successResponse(res, { data: offer });
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const offer = await offerService.createOffer(req.body, req.user.id);
    return createdResponse(res, {
      message: 'Offer created successfully',
      data: offer,
    });
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const offer = await offerService.updateOffer(req.params.id, req.body, req.user.id);
    return successResponse(res, {
      message: 'Offer updated successfully',
      data: offer,
    });
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    const offer = await offerService.deleteOffer(req.params.id, req.user.id);
    return successResponse(res, {
      message: 'Offer deactivated successfully',
      data: offer,
    });
  } catch (err) {
    next(err);
  }
}
