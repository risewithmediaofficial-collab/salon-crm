import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Calendar, Volume2, X, BellRing, CheckCheck, Trash2 } from 'lucide-react';
import useNotificationPoller from '../useNotificationPoller.js';
import { playNotificationChime } from '../notificationAudio.js';
import useAuthStore from '../../../store/authStore.js';

export function NotificationBell({
  sharedUnreadCount,
  sharedNotifications,
  sharedMarkAsRead,
  sharedMarkAllRead,
  sharedDeleteNotification,
  sharedClearAll,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [bannerCount, setBannerCount] = useState(0);
  const dropdownRef = useRef(null);
  const autoReadTimerRef = useRef(null);
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const targetPath = user?.role === 'CUSTOMER' ? '/my-appointments' : '/admin/appointments';

  // Use shared poller/store hook
  const poller = useNotificationPoller();
  const unreadCount   = sharedUnreadCount   !== undefined ? sharedUnreadCount   : poller.unreadCount;
  const notifications = sharedNotifications !== undefined ? sharedNotifications : poller.notifications;
  const markAsRead    = sharedMarkAsRead    !== undefined ? sharedMarkAsRead    : poller.markAsRead;
  const markAllRead   = sharedMarkAllRead   !== undefined ? sharedMarkAllRead   : poller.markAllRead;
  const deleteNotification = sharedDeleteNotification !== undefined ? sharedDeleteNotification : poller.deleteNotification;
  const clearAllNotifications = sharedClearAll !== undefined ? sharedClearAll : poller.clearAllNotifications;

  // Show a sticky top banner whenever new unread arrive
  const prevUnreadRef = useRef(unreadCount);
  useEffect(() => {
    const prev = prevUnreadRef.current;
    prevUnreadRef.current = unreadCount;
    if (unreadCount > 0 && unreadCount > prev) {
      setBannerCount(unreadCount);
      setShowBanner(true);
    }
    if (unreadCount === 0) {
      setShowBanner(false);
    }
  }, [unreadCount]);

  // Auto-mark notifications as read smoothly after user opens the dropdown (viewing = acknowledging)
  useEffect(() => {
    if (isOpen && unreadCount > 0) {
      setShowBanner(false);
      autoReadTimerRef.current = setTimeout(() => {
        markAllRead();
      }, 700);
    } else {
      clearTimeout(autoReadTimerRef.current);
    }
    return () => clearTimeout(autoReadTimerRef.current);
  }, [isOpen, unreadCount, markAllRead]);

  // Helper: toggle dropdown
  const toggleOpen = () => {
    setIsOpen((prev) => {
      const next = !prev;
      if (next && unreadCount > 0) {
        setShowBanner(false);
      }
      return next;
    });
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleItemClick = (notification) => {
    // Action taken on notification item -> mark read immediately
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
    setIsOpen(false);
    navigate(targetPath);
  };

  const handleItemCheck = (e, notification) => {
    e.stopPropagation();
    markAsRead(notification._id);
  };

  const handleDeleteItem = (e, id) => {
    e.stopPropagation();
    deleteNotification(id);
  };

  const handleClearAll = (e) => {
    e.stopPropagation();
    clearAllNotifications();
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      {/* ── Sticky Unread Appointment Banner ── */}
      {showBanner && user?.role !== 'CUSTOMER' && (
        <div
          className="fixed top-0 left-0 right-0 z-[999] flex items-center justify-between gap-3 px-4 sm:px-6 py-2.5
                     bg-gradient-to-r from-amber-500 via-orange-500 to-salon-700
                     shadow-lg shadow-amber-500/30 animate-in slide-in-from-top duration-300"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-white/20 shrink-0">
              <BellRing className="w-4 h-4 text-white animate-bounce" />
            </span>
            <p className="text-white text-xs font-bold truncate">
              🎉 {bannerCount} New Appointment{bannerCount > 1 ? 's' : ''} Received! Tap to review &amp; confirm.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setShowBanner(false);
                markAllRead();
                navigate(targetPath);
              }}
              className="text-xs font-bold text-amber-900 bg-white/90 hover:bg-white px-3 py-1.5 rounded-lg transition-colors shadow-sm"
            >
              View Now
            </button>
            <button
              type="button"
              onClick={() => setShowBanner(false)}
              className="text-white/70 hover:text-white p-1 rounded-lg"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Bell Icon + Dropdown ── */}
      <div className="relative" ref={dropdownRef}>
        {/* Bell Button */}
        <button
          type="button"
          onClick={toggleOpen}
          className={`relative p-2 rounded-xl transition-colors focus:outline-none ${
            unreadCount > 0
              ? 'text-amber-600 hover:text-amber-800 hover:bg-amber-50'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
          aria-label="View notifications"
          title="Appointment Notifications"
        >
          {unreadCount > 0 ? (
            <BellRing className="w-5 h-5 animate-pulse" />
          ) : (
            <Bell className="w-5 h-5" />
          )}

          {/* Unread Badge */}
          {unreadCount > 0 && (
            <span className="absolute top-0.5 right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-[10px] font-bold text-white ring-2 ring-white shadow-sm transition-transform duration-200">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown Panel */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-stone-200 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
            {/* Header */}
            <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                  Notifications
                </span>
                {unreadCount > 0 ? (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 animate-pulse">
                    {unreadCount} new
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-700">
                    All caught up
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {/* Test Chime Button */}
                <button
                  type="button"
                  onClick={playNotificationChime}
                  className="text-[10px] text-stone-500 hover:text-salon-700 p-1 rounded-lg hover:bg-stone-100 flex items-center gap-1 transition-colors"
                  title="Test Audio Chime"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Test Sound</span>
                </button>

                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => markAllRead()}
                    className="text-[10px] text-salon-700 hover:text-salon-900 font-semibold p-1 rounded hover:bg-salon-50 transition-colors flex items-center gap-1"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Mark read</span>
                  </button>
                )}

                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-[10px] text-rose-600 hover:text-rose-800 font-semibold p-1 rounded hover:bg-rose-50 transition-colors flex items-center gap-1"
                    title="Clear all notifications"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear all</span>
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-stone-100">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-10 h-10 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-2">
                    <Bell className="w-5 h-5 text-stone-400" />
                  </div>
                  <p className="text-xs font-semibold text-stone-700">No Notifications</p>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    You will be notified immediately when a new appointment arrives.
                  </p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n._id}
                    onClick={() => handleItemClick(n)}
                    className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors group ${
                      n.isRead ? 'hover:bg-stone-50/80 bg-white' : 'bg-amber-50/40 hover:bg-amber-50/70 border-l-2 border-l-amber-500'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        n.isRead
                          ? 'bg-stone-100 text-stone-500'
                          : 'bg-gradient-to-tr from-salon-800 to-amber-700 text-white shadow-xs'
                      }`}
                    >
                      <Calendar className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <h4
                          className={`text-xs truncate ${
                            n.isRead ? 'font-medium text-stone-700' : 'font-bold text-stone-900'
                          }`}
                        >
                          {n.title}
                        </h4>
                        <span className="text-[10px] text-stone-400 shrink-0">
                          {formatTimeAgo(n.createdAt)}
                        </span>
                      </div>

                      <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                        {n.message}
                      </p>
                    </div>

                    {/* Action on single item: mark read button + delete button */}
                    <div className="flex items-center gap-1 shrink-0 ml-1">
                      {!n.isRead && (
                        <button
                          type="button"
                          onClick={(e) => handleItemCheck(e, n)}
                          className="p-1 rounded-lg text-amber-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                          title="Mark as read"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={(e) => handleDeleteItem(e, n._id)}
                        className="p-1 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete notification"
                        aria-label="Delete notification"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 bg-stone-50/80 border-t border-stone-100 text-center">
              <button
                type="button"
                onClick={() => {
                  markAllRead();
                  setIsOpen(false);
                  navigate(targetPath);
                }}
                className="text-xs font-semibold text-salon-800 hover:text-salon-950 transition-colors"
              >
                {user?.role === 'CUSTOMER' ? 'View My Appointments →' : 'View All Appointments →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default NotificationBell;
