import Appointment from '../models/Appointment.js';
import Customer from '../models/Customer.js';
import Invoice from '../models/Invoice.js';
import Staff from '../models/Staff.js';
import { successResponse } from '../utils/apiResponse.js';
import { startOfDay, endOfDay } from '../utils/dateTime.js';
import { APPOINTMENT_STATUS, INVOICE_STATUS } from '../constants/index.js';

export async function getDashboardStats(req, res, next) {
  try {
    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);

    const [
      todayAppointments,
      pendingCount,
      confirmedCount,
      completedToday,
      cancelledToday,
      todayRevenue,
      newCustomersToday,
      upcomingAppointments,
      staffOnline,
    ] = await Promise.all([
      Appointment.countDocuments({ appointmentDate: { $gte: todayStart, $lte: todayEnd } }),
      Appointment.countDocuments({ status: APPOINTMENT_STATUS.PENDING }),
      Appointment.countDocuments({
        appointmentDate: { $gte: todayStart, $lte: todayEnd },
        status: APPOINTMENT_STATUS.CONFIRMED,
      }),
      Appointment.countDocuments({
        appointmentDate: { $gte: todayStart, $lte: todayEnd },
        status: APPOINTMENT_STATUS.COMPLETED,
      }),
      Appointment.countDocuments({
        appointmentDate: { $gte: todayStart, $lte: todayEnd },
        status: APPOINTMENT_STATUS.CANCELLED,
      }),
      // Revenue from paid invoices today
      Invoice.aggregate([
        {
          $match: {
            status: INVOICE_STATUS.PAID,
            issuedAt: { $gte: todayStart, $lte: todayEnd },
          },
        },
        { $group: { _id: null, total: { $sum: '$amountPaid' } } },
      ]),
      Customer.countDocuments({ createdAt: { $gte: todayStart, $lte: todayEnd } }),
      Appointment.find({
        appointmentDate: { $gte: new Date() },
        status: { $in: [APPOINTMENT_STATUS.CONFIRMED, APPOINTMENT_STATUS.ACCEPTED] },
      })
        .sort({ startTime: 1 })
        .limit(5)
        .populate('customer', 'name phone')
        .populate('service', 'name duration')
        .populate('staff', 'name')
        .lean(),
      Staff.countDocuments({ isActive: true }),
    ]);

    return successResponse(res, {
      data: {
        today: {
          total: todayAppointments,
          pending: pendingCount,
          confirmed: confirmedCount,
          completed: completedToday,
          cancelled: cancelledToday,
          revenue: todayRevenue[0]?.total || 0,
          newCustomers: newCustomersToday,
        },
        upcoming: upcomingAppointments,
        activeStaff: staffOnline,
      },
    });
  } catch (err) { next(err); }
}
