import { create } from 'zustand';
import notificationService from '../features/notifications/notificationService.js';
import {
  playNotificationChime,
  showDesktopNotification,
} from '../features/notifications/notificationAudio.js';
import useUIStore from './uiStore.js';

// Global known IDs set to prevent duplicate audio/toasts across re-renders
const knownNotificationIds = new Set();
let isInitialLoadDone = false;

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  lastFetchedAt: null,

  /**
   * Fetch latest notifications from backend and detect newly arrived items
   */
  fetchNotifications: async () => {
    const token =
      localStorage.getItem('adminAccessToken') ||
      localStorage.getItem('accessToken') ||
      localStorage.getItem('customerAccessToken');
    if (!token) return;

    try {
      const res = await notificationService.getAll({ page: 1, limit: 20 });
      const items = res.data || [];
      const unread =
        typeof res.meta?.unread === 'number'
          ? res.meta.unread
          : items.filter((item) => !item.isRead).length;

      // Detect new arrivals after initial load
      if (isInitialLoadDone && items.length > 0) {
        const newUnreadItems = items.filter(
          (item) => !knownNotificationIds.has(item._id) && !item.isRead
        );

        if (newUnreadItems.length > 0) {
          const topItem = newUnreadItems[0];
          playNotificationChime();

          useUIStore.getState().showToast({
            type: 'info',
            title: `🔔 ${topItem.title || 'New Notification'}`,
            message: topItem.message || 'A new appointment update has been received.',
            duration: 8000,
          });

          showDesktopNotification(
            topItem.title || 'New Notification',
            topItem.message || 'A new appointment update has been received.'
          );

          window.dispatchEvent(
            new CustomEvent('new-appointment-notification', { detail: topItem })
          );
        }
      }

      items.forEach((item) => knownNotificationIds.add(item._id));
      isInitialLoadDone = true;

      set({
        notifications: items,
        unreadCount: unread,
        lastFetchedAt: Date.now(),
      });
    } catch (err) {
      console.debug('Failed to fetch notifications:', err?.message || err);
    }
  },

  /**
   * Instant optimistic mark as read for a single notification item
   */
  markAsRead: (id) => {
    const { notifications, unreadCount } = get();
    const target = notifications.find((n) => n._id === id);
    if (!target || target.isRead) return;

    // 1. Instant state update (optimistic — 0ms delay)
    set({
      notifications: notifications.map((n) =>
        n._id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
      ),
      unreadCount: Math.max(0, unreadCount - 1),
    });

    // 2. Notify other windows/tabs
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('salon_notification_read_sync');
        bc.postMessage({ type: 'MARK_READ', id });
        bc.close();
      }
    } catch (e) {}

    // 3. Fire backend API request
    notificationService.markAsRead(id).catch((err) => {
      console.error('Failed to mark notification as read on backend:', err);
    });
  },

  /**
   * Instant optimistic mark all notifications as read (e.g. when visiting page or opening dropdown)
   */
  markAllRead: () => {
    const { notifications, unreadCount } = get();
    if (unreadCount === 0 && notifications.every((n) => n.isRead)) return;

    // 1. Instant state update (optimistic — 0ms delay)
    set({
      notifications: notifications.map((n) => ({
        ...n,
        isRead: true,
        readAt: n.readAt || new Date().toISOString(),
      })),
      unreadCount: 0,
    });

    // 2. Notify other windows/tabs
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('salon_notification_read_sync');
        bc.postMessage({ type: 'MARK_ALL_READ' });
        bc.close();
      }
    } catch (e) {}

    // 3. Fire backend API request
    notificationService.markAllRead().catch((err) => {
      console.error('Failed to mark all notifications as read on backend:', err);
    });
  },

  /**
   * Delete an individual notification
   */
  deleteNotification: (id) => {
    const { notifications, unreadCount } = get();
    const target = notifications.find((n) => n._id === id);
    if (!target) return;
    const wasUnread = !target.isRead;

    // 1. Instant optimistic state update
    set({
      notifications: notifications.filter((n) => n._id !== id),
      unreadCount: wasUnread ? Math.max(0, unreadCount - 1) : unreadCount,
    });

    // 2. Cross-tab sync
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('salon_notification_read_sync');
        bc.postMessage({ type: 'DELETE_NOTIFICATION', id });
        bc.close();
      }
    } catch (e) {}

    // 3. Fire backend API
    notificationService.delete(id).catch((err) => {
      console.error('Failed to delete notification on backend:', err);
    });
  },

  /**
   * Clear all notifications at once
   */
  clearAllNotifications: () => {
    // 1. Instant optimistic state update
    set({
      notifications: [],
      unreadCount: 0,
    });

    // 2. Cross-tab sync
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('salon_notification_read_sync');
        bc.postMessage({ type: 'CLEAR_ALL' });
        bc.close();
      }
    } catch (e) {}

    // 3. Fire backend API
    notificationService.clearAll().catch((err) => {
      console.error('Failed to clear all notifications on backend:', err);
    });
  },

  /**
   * Reset on logout or profile switch
   */
  reset: () => {
    set({ notifications: [], unreadCount: 0, lastFetchedAt: null });
    knownNotificationIds.clear();
    isInitialLoadDone = false;
  },
}));

export default useNotificationStore;
