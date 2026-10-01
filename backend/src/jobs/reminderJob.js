import Appointment from '../models/Appointment.js';
import Notification from '../models/Notification.js';
import { sendSMS } from '../services/smsService.js';
import { APPOINTMENT_STATUS, NOTIFICATION_TYPE } from '../constants/index.js';
import logger from '../utils/logger.js';

let intervalId = null;

export async function processAppointmentReminders() {
  try {
    const now = new Date();
    const reminderWindowStart = new Date(now.getTime() + 1 * 60 * 60 * 1000); // 1 hr ahead
    const reminderWindowEnd = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hrs ahead

    const upcomingAppointments = await Appointment.find({
      status: APPOINTMENT_STATUS.CONFIRMED,
      appointmentDate: {
        $gte: new Date(now.setHours(0, 0, 0, 0)),
        $lte: new Date(now.setHours(23, 59, 59, 999)),
      },
      startTime: { $gte: reminderWindowStart, $lte: reminderWindowEnd },
    })
      .populate('customer', 'name phone')
      .populate('service', 'name')
      .populate('staff', 'name')
      .lean();

    for (const apt of upcomingAppointments) {
      if (!apt.customer?.phone) continue;

      // Check if reminder was already sent
      const alreadySent = await Notification.findOne({
        relatedEntityId: apt._id,
        type: NOTIFICATION_TYPE.APPOINTMENT_REMINDER,
      });

      if (!alreadySent) {
        const message = `Reminder: Your appointment for ${apt.service?.name} with ${apt.staff?.name} is today at ${apt.startTime}. We look forward to welcoming you!`;

        const notification = await Notification.create({
          recipient: apt.customer._id,
          recipientModel: 'Customer',
          type: NOTIFICATION_TYPE.APPOINTMENT_REMINDER,
          title: 'Upcoming Appointment Reminder',
          message,
          relatedEntityType: 'Appointment',
          relatedEntityId: apt._id,
        });

        sendSMS(apt.customer.phone, message)
          .then(async (sent) => {
            if (sent) {
              await Notification.findByIdAndUpdate(notification._id, {
                smsSent: true,
                smsSentAt: new Date(),
              });
            }
          })
          .catch((err) => logger.warn('Reminder SMS failed', { error: err.message }));
      }
    }
  } catch (err) {
    logger.error('Appointment reminder job failed', { error: err.message });
  }
}

export function startReminderJob(intervalMs = 15 * 60 * 1000) {
  if (intervalId) return;
  logger.info('Starting appointment reminder scheduler');
  intervalId = setInterval(processAppointmentReminders, intervalMs);
}

export function stopReminderJob() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    logger.info('Stopped appointment reminder scheduler');
  }
}
