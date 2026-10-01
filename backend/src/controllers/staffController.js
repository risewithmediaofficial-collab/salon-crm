import * as staffService from '../services/staffService.js';
import { successResponse, createdResponse } from '../utils/apiResponse.js';

export async function getAll(req, res, next) {
  try {
    const staff = await staffService.getStaffList({ query: req.query });
    return successResponse(res, { data: staff });
  } catch (err) {
    next(err);
  }
}

export async function getById(req, res, next) {
  try {
    const staff = await staffService.getStaffById(req.params.id);
    return successResponse(res, { data: staff });
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const staff = await staffService.createStaff(req.body, req.user.id);
    return createdResponse(res, {
      message: 'Staff member added successfully',
      data: staff,
    });
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const staff = await staffService.updateStaff(req.params.id, req.body, req.user.id);
    return successResponse(res, {
      message: 'Staff member updated successfully',
      data: staff,
    });
  } catch (err) {
    next(err);
  }
}

export async function addLeave(req, res, next) {
  try {
    const staff = await staffService.addStaffLeave(req.params.id, req.body, req.user.id);
    return successResponse(res, {
      message: 'Leave added successfully',
      data: staff,
    });
  } catch (err) {
    next(err);
  }
}

export async function removeLeave(req, res, next) {
  try {
    const staff = await staffService.removeStaffLeave(req.params.id, req.params.leaveId, req.user.id);
    return successResponse(res, {
      message: 'Leave removed successfully',
      data: staff,
    });
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    const staff = await staffService.deactivateStaff(req.params.id, req.user.id);
    return successResponse(res, {
      message: 'Staff member deactivated successfully',
      data: staff,
    });
  } catch (err) {
    next(err);
  }
}
