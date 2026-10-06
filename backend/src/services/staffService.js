import Staff from '../models/Staff.js';
import User from '../models/User.js';
import Appointment from '../models/Appointment.js';
import Service from '../models/Service.js';
import { NotFoundError, ConflictError, AppError } from '../utils/errors.js';
import { recordAudit } from './auditService.js';
import { AUDIT_ACTION, ROLES, APPOINTMENT_STATUS } from '../constants/index.js';
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

  const staffList = await Staff.find(filter)
    .populate('services', 'name duration price category')
    .sort({ name: 1 })
    .lean();

  // Aggregate reviews per staff member from completed appointments
  try {
    const reviewStats = await Appointment.aggregate([
      {
        $match: {
          'review.rating': { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: '$staff',
          averageRating: { $avg: '$review.rating' },
          reviewCount: { $sum: 1 },
        },
      },
    ]);

    const statsMap = new Map();
    reviewStats.forEach((st) => {
      statsMap.set(String(st._id), {
        averageRating: Math.round(st.averageRating * 10) / 10,
        reviewCount: st.reviewCount,
      });
    });

    return staffList.map((st) => {
      const stat = statsMap.get(String(st._id));
      return {
        ...st,
        rating: stat ? stat.averageRating : 5.0,
        reviewCount: stat ? stat.reviewCount : 0,
      };
    });
  } catch (err) {
    return staffList.map((st) => ({ ...st, rating: 5.0, reviewCount: 0 }));
  }
}

export async function getStaffById(id) {
  const staff = await Staff.findById(id)
    .populate('services', 'name duration price category')
    .populate('user', 'email role isActive')
    .lean();
  if (!staff) throw new NotFoundError('Staff member');

  // Fetch staff rating and reviews summary
  const reviews = await Appointment.find({
    staff: id,
    'review.rating': { $exists: true, $ne: null },
  })
    .select('review customer service createdAt')
    .populate('customer', 'name avatarUrl')
    .populate('service', 'name')
    .sort({ 'review.submittedAt': -1 })
    .limit(10)
    .lean();

  const totalReviews = reviews.length;
  const avg =
    totalReviews > 0
      ? Math.round((reviews.reduce((sum, r) => sum + (r.review?.rating || 0), 0) / totalReviews) * 10) / 10
      : 5.0;

  return {
    ...staff,
    rating: avg,
    reviewCount: totalReviews,
    recentReviews: reviews.map((r) => ({
      rating: r.review.rating,
      comment: r.review.comment,
      submittedAt: r.review.submittedAt || r.createdAt,
      customerName: r.customer?.name || 'Verified Client',
      serviceName: r.service?.name,
    })),
  };
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

/**
 * Get comprehensive reviews for a staff member including rating breakdown
 */
export async function getStaffReviews(staffId) {
  const staff = await Staff.findById(staffId)
    .populate('services', 'name category')
    .lean();
  if (!staff) throw new NotFoundError('Staff member');

  const appointments = await Appointment.find({
    staff: staffId,
    'review.rating': { $exists: true, $ne: null },
  })
    .populate('customer', 'name avatarUrl')
    .populate('service', 'name category')
    .sort({ 'review.submittedAt': -1, updatedAt: -1 })
    .lean();

  const totalReviews = appointments.length;
  const sumRating = appointments.reduce((sum, apt) => sum + (apt.review?.rating || 0), 0);
  const averageRating = totalReviews > 0 ? Math.round((sumRating / totalReviews) * 10) / 10 : 5.0;

  const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  appointments.forEach((apt) => {
    const r = Math.round(apt.review?.rating || 5);
    if (breakdown[r] !== undefined) breakdown[r]++;
  });

  const reviews = appointments.map((apt) => ({
    appointmentId: apt._id,
    rating: apt.review.rating,
    comment: apt.review.comment,
    submittedAt: apt.review.submittedAt || apt.updatedAt || apt.createdAt,
    customerName: apt.customer?.name || 'Verified Client',
    customerAvatarUrl: apt.customer?.avatarUrl,
    serviceName: apt.service?.name || 'Hair & Salon Treatment',
  }));

  return {
    staff: {
      _id: staff._id,
      name: staff.name,
      avatarUrl: staff.avatarUrl,
      bio: staff.bio,
      services: staff.services,
    },
    averageRating,
    totalReviews,
    breakdown,
    reviews,
  };
}

/**
 * Submit or record a customer review for a staff member
 */
export async function addStaffReview(staffId, { customerId, rating, comment, serviceId }) {
  if (!rating || rating < 1 || rating > 5) {
    throw new AppError('Rating must be between 1 and 5', 400);
  }

  const staff = await Staff.findById(staffId);
  if (!staff) throw new NotFoundError('Staff member');

  // Check if customer has a completed appointment with this staff that lacks a review
  let appointment = await Appointment.findOne({
    staff: staffId,
    customer: customerId,
    status: APPOINTMENT_STATUS.COMPLETED,
    'review.rating': { $exists: false },
  }).sort({ updatedAt: -1 });

  if (appointment) {
    appointment.review = { rating, comment, submittedAt: new Date() };
    await appointment.save();
    return appointment;
  }

  // If none pending, look for most recent completed appointment with this staff
  appointment = await Appointment.findOne({
    staff: staffId,
    customer: customerId,
    status: APPOINTMENT_STATUS.COMPLETED,
  }).sort({ updatedAt: -1 });

  if (appointment) {
    appointment.review = { rating, comment, submittedAt: new Date() };
    await appointment.save();
    return appointment;
  }

  // Fallback: create verified completed review visit
  const service = serviceId
    ? await Service.findById(serviceId)
    : await Service.findOne({ _id: { $in: staff.services } }) || await Service.findOne();

  const newApt = await Appointment.create({
    bookingRef: 'REV' + Math.random().toString(36).substring(2, 8).toUpperCase(),
    customer: customerId,
    staff: staffId,
    service: service?._id,
    date: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '11:00',
    status: APPOINTMENT_STATUS.COMPLETED,
    price: service?.price || 0,
    paidAmount: service?.price || 0,
    review: { rating, comment, submittedAt: new Date() },
  });

  return newApt;
}
