import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Calendar, Volume2, Sparkles, X } from 'lucide-react';
import useNotificationPoller from '../useNotificationPoller.js';
import { playNotificationChime } from '../notificationAudio.js';

import useAuthStore from '../../../store/authStore.js';

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const targetPath = user?.role === 'CUSTOMER' ? '/my-appointments' : '/admin/appointments';

  const { notifications, unreadCount, markAsRead, markAllRead } = useNotificationPoller();

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
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
    setIsOpen(false);
    navigate(targetPath);
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
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors focus:outline-none"
        aria-label="View notifications"
        title="Appointment Notifications"
      >
        <Bell className="w-5 h-5" />

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-rose-600 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
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
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                  {unreadCount} new
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
                  onClick={markAllRead}
                  className="text-[10px] text-salon-700 hover:text-salon-900 font-semibold p-1 rounded hover:bg-salon-50 transition-colors"
                >
                  Mark all read
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
                  className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                    n.isRead ? 'hover:bg-stone-50/80 bg-white' : 'bg-amber-50/30 hover:bg-amber-50/60'
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

                  {!n.isRead && (
                    <span className="w-2 h-2 rounded-full bg-salon-600 shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 bg-stone-50/80 border-t border-stone-100 text-center">
            <button
              type="button"
              onClick={() => {
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
  );
}

export default NotificationBell;
