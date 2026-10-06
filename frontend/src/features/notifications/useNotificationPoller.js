import { useEffect } from 'react';
import useNotificationStore from '../../store/notificationStore.js';
import useAuthStore from '../../store/authStore.js';
import { requestDesktopNotificationPermission } from './notificationAudio.js';

let activeSubscribers = 0;
let pollerInterval = null;

export function useNotificationPoller() {
  const notifications = useNotificationStore((state) => state.notifications);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const isLoading = useNotificationStore((state) => state.isLoading);
  const fetchNotifications = useNotificationStore((state) => state.fetchNotifications);
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  const markAllRead = useNotificationStore((state) => state.markAllRead);
  const deleteNotification = useNotificationStore((state) => state.deleteNotification);
  const clearAllNotifications = useNotificationStore((state) => state.clearAllNotifications);

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Prompt for desktop notification permission smoothly on first load
    requestDesktopNotificationPermission();

    // Initial fetch on mount
    fetchNotifications();

    activeSubscribers++;

    // Single interval poller across all components
    if (!pollerInterval) {
      pollerInterval = setInterval(() => {
        const token =
          localStorage.getItem('adminAccessToken') ||
          localStorage.getItem('accessToken') ||
          localStorage.getItem('customerAccessToken');
        if (!token) return;
        useNotificationStore.getState().fetchNotifications();
      }, 5000);
    }

    // Cross-tab BroadcastChannel for bookings
    let syncChannel = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        syncChannel = new BroadcastChannel('salon_appointment_sync');
        syncChannel.onmessage = () => {
          useNotificationStore.getState().fetchNotifications();
        };
      }
    } catch (err) {}

    // Cross-tab BroadcastChannel for instant read updates
    let readSyncChannel = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        readSyncChannel = new BroadcastChannel('salon_notification_read_sync');
        readSyncChannel.onmessage = (e) => {
          if (e.data?.type === 'MARK_ALL_READ') {
            useNotificationStore.setState((state) => ({
              notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
              unreadCount: 0,
            }));
          } else if (e.data?.type === 'MARK_READ' && e.data.id) {
            useNotificationStore.setState((state) => ({
              notifications: state.notifications.map((n) =>
                n._id === e.data.id ? { ...n, isRead: true } : n
              ),
              unreadCount: Math.max(0, state.unreadCount - 1),
            }));
          } else if (e.data?.type === 'DELETE_NOTIFICATION' && e.data.id) {
            useNotificationStore.setState((state) => {
              const target = state.notifications.find((n) => n._id === e.data.id);
              const wasUnread = target && !target.isRead;
              return {
                notifications: state.notifications.filter((n) => n._id !== e.data.id),
                unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
              };
            });
          } else if (e.data?.type === 'CLEAR_ALL') {
            useNotificationStore.setState({
              notifications: [],
              unreadCount: 0,
            });
          }
        };
      }
    } catch (err) {}

    // Storage event fallback for cross-tab sync
    const handleStorage = (e) => {
      if (e.key === 'salon_last_booking_event') {
        useNotificationStore.getState().fetchNotifications();
      }
    };
    window.addEventListener('storage', handleStorage);

    // Same-window custom event
    const handleCustomEvent = () => {
      useNotificationStore.getState().fetchNotifications();
    };
    window.addEventListener('new-appointment-notification', handleCustomEvent);

    // Visibility change / tab focus: refresh immediately when user returns to tab
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        useNotificationStore.getState().fetchNotifications();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);

    return () => {
      activeSubscribers--;
      if (activeSubscribers <= 0) {
        if (pollerInterval) {
          clearInterval(pollerInterval);
          pollerInterval = null;
        }
      }
      if (syncChannel) syncChannel.close();
      if (readSyncChannel) readSyncChannel.close();
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('new-appointment-notification', handleCustomEvent);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
    };
  }, [isAuthenticated, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllRead,
    deleteNotification,
    clearAllNotifications,
    refetch: fetchNotifications,
  };
}

export default useNotificationPoller;
