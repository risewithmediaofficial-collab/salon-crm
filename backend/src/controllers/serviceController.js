import * as serviceService from '../services/serviceService.js';
import { successResponse, createdResponse } from '../utils/apiResponse.js';

export async function getAll(req, res, next) {
  try {
    const services = await serviceService.getServices({ query: req.query });
    return successResponse(res, { data: services });
  } catch (err) {
    next(err);
  }
}

export async function getById(req, res, next) {
  try {
    const service = await serviceService.getServiceById(req.params.id);
    return successResponse(res, { data: service });
  } catch (err) {
    next(err);
  }
}

export async function getCategories(req, res, next) {
  try {
    const categories = await serviceService.getCategories();
    return successResponse(res, { data: categories });
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const service = await serviceService.createService(req.body, req.user.id);
    return createdResponse(res, {
      message: 'Service created successfully',
      data: service,
    });
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const service = await serviceService.updateService(req.params.id, req.body, req.user.id);
    return successResponse(res, {
      message: 'Service updated successfully',
      data: service,
    });
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    const service = await serviceService.deleteService(req.params.id, req.user.id);
    return successResponse(res, {
      message: 'Service deactivated successfully',
      data: service,
    });
  } catch (err) {
    next(err);
  }
}
