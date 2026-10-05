/**
 * notificationService.js
 * Creates in-app notifications and triggers SMS (non-blocking)
 */
import Notification from '../models/Notification.js';
import Customer from '../models/Customer.js';
import User from '../models/User.js';
import { sendSMS } from './smsService.js';
import { NOTIFICATION_TYPE, ROLES } from '../constants/index.js';
import logger from '../utils/logger.js';

/**
 * Create an in-app notification and optionally send SMS
 */
async function createNotification({ recipientId, recipientModel, type, title, message, relatedEntityType, relatedEntityId, sendSMSFlag = false, phone = null }) {
  try {
    const notification = await Notification.create({
      recipient: recipientId,
      recipientModel,
      type,
      title,
      message,
      relatedEntityType,
      relatedEntityId,
    });

    if (sendSMSFlag && phone) {
      sendSMS(phone, message)
        .then(async (sent) => {
          if (sent) {
            await Notification.findByIdAndUpdate(notification._id, {
              smsSent: true,
              smsSentAt: new Date(),
            });
          }
        })
        .catch((err) => logger.warn('SMS notification failed', { error: err.message }));
    }

    return notification;
  } catch (err) {
    logger.warn('Failed to create notification', { error: err.message });
  }
}

/**
 * Notify customer, salon admins, and assigned staff of new appointment booking
 */
export async function notifyAppointmentBooked(appointment, customer, service, staff) {
  // 1. Notify Customer
  if (customer) {
    await createNotification({
      recipientId: customer._id,
      recipientModel: 'Customer',
      type: NOTIFICATION_TYPE.APPOINTMENT_BOOKED,
      title: 'Appointment Booked',
      message: `Your appointment for ${service?.name || 'service'} has been received and is pending salon confirmation.`,
      relatedEntityType: 'Appointment',
      relatedEntityId: appointment._id,
      sendSMSFlag: true,
      phone: customer.phone,
    });
  }

  // 2. Notify Salon Admin / Management team & Staff
  try {
    const teamMembers = await User.find({
      role: { $in: [ROLES.OWNER, ROLES.MANAGER, ROLES.STAFF] },
      isActive: true,
    }).select('_id');

    const customerName = customer?.name || 'A client';
    const serviceName = service?.name || 'treatment';
    const stylistName = staff?.name || 'stylist';

    for (const member of teamMembers) {
      await createNotification({
        recipientId: member._id,
        recipientModel: 'User',
        type: NOTIFICATION_TYPE.APPOINTMENT_BOOKED,
        title: 'New Online Appointment',
        message: `${customerName} booked ${serviceName} with ${stylistName}`,
        relatedEntityType: 'Appointment',
        relatedEntityId: appointment._id,
      });
    }
  } catch (err) {
    logger.warn('Failed to dispatch team notification for appointment', { error: err.message });
  }
}

/**
 * Notify customer of appointment status update
 */
export async function notifyAppointmentStatusChange(appointment, customer, newStatus, options = {}) {
  const { changedByModel, reason } = options;

  const messages = {
    ACCEPTED: { title: 'Appointment Accepted', message: 'Your appointment has been accepted. See you soon!' },
    REJECTED: { title: 'Appointment Rejected', message: 'Your appointment request was not accepted. Please try booking another slot.' },
    CANCELLED: { title: 'Appointment Cancelled', message: 'Your appointment has been cancelled.' },
    CONFIRMED: { title: 'Appointment Confirmed', message: 'Your appointment is confirmed. We look forward to seeing you!' },
    COMPLETED: { title: 'Visit Complete', message: 'Thank you for visiting us! We hope to see you again.' },
  };

  const content = messages[newStatus];
  if (content && customer) {
    await createNotification({
      recipientId: customer._id,
      recipientModel: 'Customer',
      type: NOTIFICATION_TYPE[`APPOINTMENT_${newStatus}`] || NOTIFICATION_TYPE.APPOINTMENT_BOOKED,
      ...content,
      relatedEntityType: 'Appointment',
      relatedEntityId: appointment._id,
      sendSMSFlag: true,
      phone: customer.phone,
    });
  }

  // If action was taken online by a customer (e.g. cancelled), notify salon staff & management
  if (changedByModel === 'Customer') {
    try {
      const teamMembers = await User.find({
        role: { $in: [ROLES.OWNER, ROLES.MANAGER, ROLES.STAFF] },
        isActive: true,
      }).select('_id');

      const customerName = customer?.name || 'A customer';
      const statusTitle = newStatus === 'CANCELLED' ? 'Online Appointment Cancelled' : `Online Appointment ${newStatus}`;
      const statusMsg = `${customerName} ${newStatus === 'CANCELLED' ? 'cancelled their appointment online' : `updated their appointment status to ${newStatus}`}${reason ? `: "${reason}"` : '.'}`;

      for (const member of teamMembers) {
        await createNotification({
          recipientId: member._id,
          recipientModel: 'User',
          type: NOTIFICATION_TYPE[`APPOINTMENT_${newStatus}`] || NOTIFICATION_TYPE.APPOINTMENT_BOOKED,
          title: statusTitle,
          message: statusMsg,
          relatedEntityType: 'Appointment',
          relatedEntityId: appointment._id,
        });
      }
    } catch (err) {
      logger.warn('Failed to dispatch team notification for customer status change', { error: err.message });
    }
  }
}

/**
 * Get unread notification count for a recipient
 */
export async function getUnreadCount(recipientId) {
  return Notification.countDocuments({ recipient: recipientId, isRead: false });
}

export async function getNotifications(recipientId, { page = 1, limit = 20 } = {}) {
  const skip = (page - 1) * limit;
  const [notifications, total, unread] = await Promise.all([
    Notification.find({ recipient: recipientId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Notification.countDocuments({ recipient: recipientId }),
    Notification.countDocuments({ recipient: recipientId, isRead: false }),
  ]);

  return { notifications, total, unread };
}

export async function markAsRead(notificationId, recipientId) {
  return Notification.findOneAndUpdate(
    { _id: notificationId, recipient: recipientId },
    { isRead: true, readAt: new Date() },
    { new: true }
  );
}

export async function markAllAsRead(recipientId) {
  return Notification.updateMany(
    { recipient: recipientId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
}

