import { useState, useEffect, useRef, useCallback } from 'react';
import notificationService from './notificationService.js';
import {
  playNotificationChime,
  showDesktopNotification,
  requestDesktopNotificationPermission,
} from './notificationAudio.js';
import useUIStore from '../../store/uiStore.js';
import useAuthStore from '../../store/authStore.js';

export function useNotificationPoller() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const showToast = useUIStore((state) => state.showToast);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const role = useAuthStore((state) => state.role);

  // Keep track of all known notification IDs to accurately detect new arrivals
  const knownIdsRef = useRef(new Set());
  const isInitialMount = useRef(true);

  const fetchNotifications = useCallback(async () => {
    const token =
      localStorage.getItem('adminAccessToken') ||
      localStorage.getItem('accessToken') ||
      localStorage.getItem('customerAccessToken');
    if (!token) return;

    try {
      const res = await notificationService.getAll({ page: 1, limit: 15 });
      const items = res.data || [];
      const unread =
        typeof res.meta?.unread === 'number'
          ? res.meta.unread
          : items.filter((item) => !item.isRead).length;

      // Safety guard: ensure knownIdsRef.current is a Set
      if (!(knownIdsRef.current instanceof Set)) {
        knownIdsRef.current = new Set();
      }

      const unreadItems = items.filter((item) => !item.isRead);

      // Check if new notifications arrived after initial load
      if (!isInitialMount.current && items.length > 0) {
        // Detect newly arrived items that we haven't seen in this session
        const newUnreadItems = items.filter(
          (item) => !knownIdsRef.current.has(item._id) && !item.isRead
        );

        if (newUnreadItems.length > 0) {
          const topItem = newUnreadItems[0];

          // 1. Play audible luxury chime
          playNotificationChime();

          // 2. Show in-app banner toast notification
          showToast({
            type: 'info',
            title: `🔔 ${topItem.title || 'New Online Appointment'}`,
            message: topItem.message || 'A new appointment booking has been received.',
            duration: 8000,
          });

          // 3. Show OS desktop notification if user has granted permission
          showDesktopNotification(
            topItem.title || 'New Online Appointment',
            topItem.message || 'A new appointment booking has been received.'
          );

          // 4. Broadcast event to real-time pages (Calendar, Appointments Table, POS)
          window.dispatchEvent(
            new CustomEvent('new-appointment-notification', { detail: topItem })
          );
        }
      }
      // Note: We intentionally do NOT show a startup toast on initial load.
      // The NotificationBell badge + sticky banner handles unread visibility.

      // Record all current item IDs into known set
      items.forEach((item) => knownIdsRef.current.add(item._id));
      isInitialMount.current = false;

      setNotifications(items);
      setUnreadCount(unread);
    } catch (err) {
      console.debug('Failed to fetch notifications:', err?.message || err);
    }
  }, [isAuthenticated, showToast]);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Prompt for desktop notification permission smoothly on first load
    requestDesktopNotificationPermission();

    // Initial fetch
    fetchNotifications();

    // 1. Fast background poll every 5 seconds for real-time responsiveness
    const timer = setInterval(() => {
      const token =
        localStorage.getItem('adminAccessToken') ||
        localStorage.getItem('accessToken') ||
        localStorage.getItem('customerAccessToken');
      if (!token) return;
      fetchNotifications();
    }, 5000);

    // 2. Cross-tab BroadcastChannel: when an appointment is booked in any tab/window, sync instantly!
    let channel = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        channel = new BroadcastChannel('salon_appointment_sync');
        channel.onmessage = () => {
          fetchNotifications();
        };
      }
    } catch (err) {}

    // 3. Storage event fallback for cross-tab sync
    const handleStorage = (e) => {
      if (e.key === 'salon_last_booking_event') {
        fetchNotifications();
      }
    };
    window.addEventListener('storage', handleStorage);

    // 4. Same-window custom event
    const handleCustomEvent = () => {
      fetchNotifications();
    };
    window.addEventListener('new-appointment-notification', handleCustomEvent);

    // 5. Visibility change / tab focus: refresh immediately when admin returns to tab
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchNotifications();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);

    return () => {
      clearInterval(timer);
      if (channel) channel.close();
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('new-appointment-notification', handleCustomEvent);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
    };
  }, [isAuthenticated, fetchNotifications]);

  const markAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true, readAt: new Date() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllRead,
    refetch: fetchNotifications,
  };
}

export default useNotificationPoller;
