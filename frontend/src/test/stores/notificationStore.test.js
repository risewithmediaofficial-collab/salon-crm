import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useNotificationStore } from '../../store/notificationStore.js';

// Mock dependencies
vi.mock('../../features/notifications/notificationService.js', () => ({
  default: {
    getAll: vi.fn(),
    markAsRead: vi.fn().mockResolvedValue({}),
    markAllRead: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
    clearAll: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('../../features/notifications/notificationAudio.js', () => ({
  playNotificationChime: vi.fn(),
  showDesktopNotification: vi.fn(),
}));

describe('Notification Store (useNotificationStore)', () => {
  beforeEach(() => {
    useNotificationStore.getState().reset();
  });

  it('initializes with empty notifications and zero unread count', () => {
    const state = useNotificationStore.getState();
    expect(state.notifications).toEqual([]);
    expect(state.unreadCount).toBe(0);
  });

  it('optimistically marks an unread notification as read', () => {
    const initialItems = [
      { _id: 'notif_1', title: 'Booking Confirmed', isRead: false },
      { _id: 'notif_2', title: 'Reminder', isRead: false },
    ];

    useNotificationStore.setState({
      notifications: initialItems,
      unreadCount: 2,
    });

    useNotificationStore.getState().markAsRead('notif_1');

    const state = useNotificationStore.getState();
    expect(state.unreadCount).toBe(1);
    expect(state.notifications.find((n) => n._id === 'notif_1').isRead).toBe(true);
    expect(state.notifications.find((n) => n._id === 'notif_2').isRead).toBe(false);
  });

  it('optimistically marks all notifications as read', () => {
    useNotificationStore.setState({
      notifications: [
        { _id: 'n1', isRead: false },
        { _id: 'n2', isRead: false },
      ],
      unreadCount: 2,
    });

    useNotificationStore.getState().markAllRead();

    const state = useNotificationStore.getState();
    expect(state.unreadCount).toBe(0);
    expect(state.notifications.every((n) => n.isRead)).toBe(true);
  });

  it('optimistically deletes a notification and adjusts unreadCount if unread', () => {
    useNotificationStore.setState({
      notifications: [
        { _id: 'n1', isRead: false },
        { _id: 'n2', isRead: true },
      ],
      unreadCount: 1,
    });

    useNotificationStore.getState().deleteNotification('n1');

    const state = useNotificationStore.getState();
    expect(state.notifications).toHaveLength(1);
    expect(state.notifications[0]._id).toBe('n2');
    expect(state.unreadCount).toBe(0);
  });

  it('clears all notifications', () => {
    useNotificationStore.setState({
      notifications: [{ _id: 'n1', isRead: false }],
      unreadCount: 1,
    });

    useNotificationStore.getState().clearAllNotifications();

    const state = useNotificationStore.getState();
    expect(state.notifications).toHaveLength(0);
    expect(state.unreadCount).toBe(0);
  });
});
