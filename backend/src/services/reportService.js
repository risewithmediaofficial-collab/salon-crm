import Appointment from '../models/Appointment.js';
import Invoice from '../models/Invoice.js';
import Customer from '../models/Customer.js';
import { APPOINTMENT_STATUS, INVOICE_STATUS } from '../constants/index.js';

export async function getRevenueReport({ startDate, endDate }) {
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();
  end.setHours(23, 59, 59, 999);

  const matchStage = {
    createdAt: { $gte: start, $lte: end },
    status: { $in: [INVOICE_STATUS.PAID, INVOICE_STATUS.PARTIALLY_PAID] },
  };

  const [revenueStats, paymentMethodStats, dailyTrend] = await Promise.all([
    Invoice.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amountPaid' },
          totalInvoices: { $sum: 1 },
          averageBillValue: { $avg: '$totalAmount' },
        },
      },
    ]),
    Invoice.aggregate([
      { $match: matchStage },
      { $unwind: '$payments' },
      {
        $group: {
          _id: '$payments.method',
          totalAmount: { $sum: '$payments.amount' },
          transactionCount: { $sum: 1 },
        },
      },
    ]),
    Invoice.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$amountPaid' },
          invoices: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  return {
    summary: revenueStats[0] || { totalRevenue: 0, totalInvoices: 0, averageBillValue: 0 },
    paymentMethods: paymentMethodStats,
    dailyTrend,
  };
}

export async function getStaffPerformanceReport({ startDate, endDate }) {
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();
  end.setHours(23, 59, 59, 999);

  return Appointment.aggregate([
    {
      $match: {
        appointmentDate: { $gte: start, $lte: end },
      },
    },
    {
      $group: {
        _id: '$staff',
        totalBookings: { $sum: 1 },
        completed: {
          $sum: { $cond: [{ $eq: ['$status', APPOINTMENT_STATUS.COMPLETED] }, 1, 0] },
        },
        cancelled: {
          $sum: { $cond: [{ $eq: ['$status', APPOINTMENT_STATUS.CANCELLED] }, 1, 0] },
        },
        noShows: {
          $sum: { $cond: [{ $eq: ['$status', APPOINTMENT_STATUS.NO_SHOW] }, 1, 0] },
        },
      },
    },
    {
      $lookup: {
        from: 'staffs',
        localField: '_id',
        foreignField: '_id',
        as: 'staffDetails',
      },
    },
    { $unwind: '$staffDetails' },
    {
      $project: {
        staffId: '$_id',
        staffName: '$staffDetails.name',
        avatarUrl: '$staffDetails.avatarUrl',
        totalBookings: 1,
        completed: 1,
        cancelled: 1,
        noShows: 1,
        completionRate: {
          $cond: [
            { $gt: ['$totalBookings', 0] },
            { $multiply: [{ $divide: ['$completed', '$totalBookings'] }, 100] },
            0,
          ],
        },
      },
    },
    { $sort: { completed: -1 } },
  ]);
}

export async function getTopServicesReport({ startDate, endDate }) {
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();
  end.setHours(23, 59, 59, 999);

  return Appointment.aggregate([
    {
      $match: {
        appointmentDate: { $gte: start, $lte: end },
        status: APPOINTMENT_STATUS.COMPLETED,
      },
    },
    {
      $group: {
        _id: '$service',
        bookingsCount: { $sum: 1 },
        totalRevenue: { $sum: '$billingSnapshot.totalAmount' },
      },
    },
    {
      $lookup: {
        from: 'services',
        localField: '_id',
        foreignField: '_id',
        as: 'serviceDetails',
      },
    },
    { $unwind: '$serviceDetails' },
    {
      $project: {
        serviceId: '$_id',
        serviceName: '$serviceDetails.name',
        category: '$serviceDetails.category',
        price: '$serviceDetails.price',
        bookingsCount: 1,
        totalRevenue: 1,
      },
    },
    { $sort: { bookingsCount: -1 } },
    { $limit: 10 },
  ]);
}

export async function getCustomerGrowthReport({ startDate, endDate }) {
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();
  end.setHours(23, 59, 59, 999);

  const [monthlyNewCustomers, totalCustomers] = await Promise.all([
    Customer.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          newCustomers: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Customer.countDocuments({ isActive: true }),
  ]);

  return {
    totalCustomers,
    monthlyNewCustomers,
  };
}
