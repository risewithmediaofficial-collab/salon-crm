import * as customerService from '../services/customerService.js';
import { successResponse, createdResponse } from '../utils/apiResponse.js';

export async function getAll(req, res, next) {
  try {
    const result = await customerService.getCustomers({ query: req.query });
    return successResponse(res, {
      data: result.customers,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
}

export async function getById(req, res, next) {
  try {
    const customer = await customerService.getCustomerById(req.params.id);
    return successResponse(res, { data: customer });
  } catch (err) {
    next(err);
  }
}

export async function getProfile(req, res, next) {
  try {
    const customer = await customerService.getCustomerById(req.user.id);
    return successResponse(res, { data: customer });
  } catch (err) {
    next(err);
  }
}

export async function createAdmin(req, res, next) {
  try {
    const customer = await customerService.createCustomerAdmin(req.body, req.user.id);
    return createdResponse(res, {
      message: 'Customer registered successfully',
      data: customer,
    });
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const id = req.user.role === 'CUSTOMER' ? req.user.id : req.params.id;
    const customer = await customerService.updateCustomer(id, req.body, req.user.id);
    return successResponse(res, {
      message: 'Customer updated successfully',
      data: customer,
    });
  } catch (err) {
    next(err);
  }
}
