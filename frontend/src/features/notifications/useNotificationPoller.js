import { useState, useEffect, useRef, useCallback } from 'react';
import notificationService from './notificationService.js';
import { playNotificationChime, showDesktopNotification, requestDesktopNotificationPermission } from './notificationAudio.js';
import useUIStore from '../../store/uiStore.js';
import useAuthStore from '../../store/authStore.js';

export function useNotificationPoller() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const showToast = useUIStore((state) => state.showToast);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const role = useAuthStore((state) => state.role);

  // Keep track of the newest notification ID seen
  const latestIdRef = useRef(null);
  const isInitialMount = useRef(true);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await notificationService.getAll({ page: 1, limit: 15 });
      const items = res.data || [];
      const unread = res.meta?.unread || 0;

      // Check if new notifications arrived after initial load
      if (!isInitialMount.current && items.length > 0) {
        const topItem = items[0];
        if (latestIdRef.current && topItem._id !== latestIdRef.current && !topItem.isRead) {
          // Play audible chime
          playNotificationChime();

          // Show in-app banner toast
          showToast({
            type: 'info',
            title: `🔔 ${topItem.title}`,
            message: topItem.message,
          });

          // Show OS desktop notification if allowed
          showDesktopNotification(topItem.title, topItem.message);

          // Broadcast custom event so appointments calendar / table can re-fetch in real time
          window.dispatchEvent(new CustomEvent('new-appointment-notification', { detail: topItem }));
        }
      }

      if (items.length > 0) {
        latestIdRef.current = items[0]._id;
      }
      isInitialMount.current = false;

      setNotifications(items);
      setUnreadCount(unread);
    } catch (err) {
      console.debug('Failed to fetch notifications:', err.message);
    }
  }, [isAuthenticated, showToast]);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Prompt for desktop notification permission smoothly
    requestDesktopNotificationPermission();

    fetchNotifications();

    // Poll every 10 seconds for real-time responsiveness
    const timer = setInterval(() => {
      fetchNotifications();
    }, 10000);

    return () => clearInterval(timer);
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
