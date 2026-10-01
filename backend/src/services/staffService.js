import Staff from '../models/Staff.js';
import User from '../models/User.js';
import { NotFoundError, ConflictError, AppError } from '../utils/errors.js';
import { recordAudit } from './auditService.js';
import { AUDIT_ACTION, ROLES } from '../constants/index.js';
import argon2 from 'argon2';

const DEFAULT_WORKING_HOURS = [
  { dayOfWeek: 0, isWorking: false, startTime: '09:00', endTime: '18:00' }, // Sunday closed by default
  { dayOfWeek: 1, isWorking: true, startTime: '09:00', endTime: '18:00' },
  { dayOfWeek: 2, isWorking: true, startTime: '09:00', endTime: '18:00' },
  { dayOfWeek: 3, isWorking: true, startTime: '09:00', endTime: '18:00' },
  { dayOfWeek: 4, isWorking: true, startTime: '09:00', endTime: '18:00' },
  { dayOfWeek: 5, isWorking: true, startTime: '09:00', endTime: '18:00' },
  { dayOfWeek: 6, isWorking: true, startTime: '09:00', endTime: '18:00' },
];

export async function getStaffList({ query = {} }) {
  const filter = {};

  if (query.activeOnly !== 'false') {
    filter.isActive = true;
  }
  if (query.serviceId) {
    filter.services = query.serviceId;
  }
  if (query.search) {
    const s = query.search.trim();
    filter.$or = [
      { name: { $regex: s, $options: 'i' } },
      { email: { $regex: s, $options: 'i' } },
      { phone: { $regex: s, $options: 'i' } },
    ];
  }

  return Staff.find(filter)
    .populate('services', 'name duration price category')
    .sort({ name: 1 })
    .lean();
}

export async function getStaffById(id) {
  const staff = await Staff.findById(id)
    .populate('services', 'name duration price category')
    .populate('user', 'email role isActive')
    .lean();
  if (!staff) throw new NotFoundError('Staff member');
  return staff;
}

export async function createStaff(data, actorId) {
  // Check email conflict in User
  const existingUser = await User.findOne({ email: data.email.toLowerCase() });
  if (existingUser) {
    throw new ConflictError('A user with this email already exists');
  }

  // Hash password with argon2
  const passwordHash = await argon2.hash(data.password);

  const role = data.role && [ROLES.STAFF, ROLES.MANAGER].includes(data.role)
    ? data.role
    : ROLES.STAFF;

  const user = await User.create({
    email: data.email.toLowerCase(),
    passwordHash,
    role,
    name: data.name,
    isActive: true,
  });

  const staff = await Staff.create({
    user: user._id,
    name: data.name,
    email: data.email.toLowerCase(),
    phone: data.phone,
    bio: data.bio,
    avatarUrl: data.avatarUrl,
    services: data.services || [],
    workingHours: data.workingHours && data.workingHours.length > 0 ? data.workingHours : DEFAULT_WORKING_HOURS,
    isActive: true,
  });

  await recordAudit({
    action: AUDIT_ACTION.STAFF_CREATED,
    performedBy: actorId,
    performedByModel: 'User',
    entityType: 'Staff',
    entityId: staff._id,
    description: `Created staff member ${staff.name} (${user.role})`,
  });

  return staff;
}

export async function updateStaff(id, data, actorId) {
  const staff = await Staff.findById(id);
  if (!staff) throw new NotFoundError('Staff member');

  Object.assign(staff, data);
  await staff.save();

  // If name changed, update linked user name as well
  if (data.name) {
    await User.findByIdAndUpdate(staff.user, { name: data.name });
  }

  await recordAudit({
    action: AUDIT_ACTION.STAFF_UPDATED,
    performedBy: actorId,
    performedByModel: 'User',
    entityType: 'Staff',
    entityId: staff._id,
    description: `Updated staff member ${staff.name}`,
  });

  return staff;
}

export async function addStaffLeave(id, leaveData, actorId) {
  const staff = await Staff.findById(id);
  if (!staff) throw new NotFoundError('Staff member');

  const start = new Date(leaveData.startDate);
  const end = new Date(leaveData.endDate);

  if (start > end) {
    throw new AppError('Leave start date must be before end date', 400);
  }

  staff.leaves.push({
    startDate: start,
    endDate: end,
    reason: leaveData.reason || '',
  });

  await staff.save();

  await recordAudit({
    action: AUDIT_ACTION.STAFF_UPDATED,
    performedBy: actorId,
    performedByModel: 'User',
    entityType: 'Staff',
    entityId: staff._id,
    description: `Added leave for ${staff.name}: ${leaveData.startDate} to ${leaveData.endDate}`,
  });

  return staff;
}

export async function removeStaffLeave(id, leaveId, actorId) {
  const staff = await Staff.findById(id);
  if (!staff) throw new NotFoundError('Staff member');

  staff.leaves = staff.leaves.filter((l) => String(l._id) !== String(leaveId));
  await staff.save();

  return staff;
}

export async function deactivateStaff(id, actorId) {
  const staff = await Staff.findById(id);
  if (!staff) throw new NotFoundError('Staff member');

  staff.isActive = false;
  await staff.save();

  // Deactivate linked user login as well
  await User.findByIdAndUpdate(staff.user, { isActive: false });

  await recordAudit({
    action: AUDIT_ACTION.STAFF_DELETED,
    performedBy: actorId,
    performedByModel: 'User',
    entityType: 'Staff',
    entityId: staff._id,
    description: `Deactivated staff member ${staff.name}`,
  });

  return staff;
}
