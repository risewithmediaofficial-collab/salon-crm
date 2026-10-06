import * as notificationService from '../services/notificationService.js';
import { successResponse } from '../utils/apiResponse.js';

export async function getAll(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));

    const result = await notificationService.getNotifications(req.user.id, { page, limit });

    return successResponse(res, {
      data: result.notifications,
      meta: { unread: result.unread, total: result.total },
    });
  } catch (err) {
    next(err);
  }
}

export async function markAsRead(req, res, next) {
  try {
    const notification = await notificationService.markAsRead(req.params.id, req.user.id);
    return successResponse(res, { data: notification });
  } catch (err) {
    next(err);
  }
}

export async function markAllRead(req, res, next) {
  try {
    await notificationService.markAllAsRead(req.user.id);
    return successResponse(res, { message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
}

export async function deleteNotification(req, res, next) {
  try {
    await notificationService.deleteNotification(req.params.id, req.user.id);
    return successResponse(res, { message: 'Notification deleted successfully' });
  } catch (err) {
    next(err);
  }
}

export async function clearAll(req, res, next) {
  try {
    await notificationService.clearAllNotifications(req.user.id);
    return successResponse(res, { message: 'All notifications cleared successfully' });
  } catch (err) {
    next(err);
  }
}
