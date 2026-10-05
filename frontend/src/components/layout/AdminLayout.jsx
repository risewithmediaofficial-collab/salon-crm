import React, { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore.js';
import useUIStore from '../../store/uiStore.js';
import ToastContainer from '../common/ToastContainer.jsx';
import useNotificationPoller from '../../features/notifications/useNotificationPoller.js';
import {
  LayoutDashboard,
  CalendarCheck,
  CalendarDays,
  Users,
  Scissors,
  UserCog,
  Receipt,
  ShoppingBag,
  TicketPercent,
  BarChart3,
  History,
  LogOut,
  ExternalLink,
  Menu,
  X,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import config from '../../config/index.js';
import NotificationBell from '../../features/notifications/components/NotificationBell.jsx';
import ErrorBoundary from '../common/ErrorBoundary.jsx';

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const role = useAuthStore((state) => state.role);
  const logout = useAuthStore((state) => state.logout);

  const isSidebarOpen = useUIStore((state) => state.isSidebarOpen);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const setSidebarOpen = useUIStore((state) => state.setSidebarOpen);

  // Live notification count — shared between sidebar badge + bell icon
  const { unreadCount, notifications, markAsRead, markAllRead } = useNotificationPoller();

  // Authorization guard
  if (!role || !['OWNER', 'MANAGER', 'STAFF'].includes(role)) {
    return <Navigate to="/staff-login" state={{ from: location }} replace />;
  }

  const isOwnerOrManager = ['OWNER', 'MANAGER'].includes(role);

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { label: 'Appointments', icon: CalendarCheck, path: '/admin/appointments', badge: unreadCount },
    { label: 'Calendar View', icon: CalendarDays, path: '/admin/calendar' },
    { label: 'POS Billing', icon: ShoppingBag, path: '/admin/pos' },
    { label: 'Customers', icon: Users, path: '/admin/customers' },
    { label: 'Services & Pricing', icon: Scissors, path: '/admin/services' },
    { label: 'Staff & Roster', icon: UserCog, path: '/admin/staff' },
    { label: 'Billing & Invoices', icon: Receipt, path: '/admin/billing' },
    { label: 'Offers & Promos', icon: TicketPercent, path: '/admin/offers' },
    ...(isOwnerOrManager
      ? [
          { label: 'Reports & Revenue', icon: BarChart3, path: '/admin/reports' },
          { label: 'Audit Trail', icon: History, path: '/admin/audit' },
        ]
      : []),
  ];

  const handleLogout = () => {
    logout();
    navigate('/staff-login');
  };

  const isPosRoute = location.pathname.startsWith('/admin/pos');
  const [isPosNavbarHidden, setIsPosNavbarHidden] = useState(false);
  const mainWrapperRef = useRef(null);

  useEffect(() => {
    if (!isPosRoute) {
      setIsPosNavbarHidden(false);
      return;
    }

    let ticking = false;

    const handleScroll = (e) => {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        const target = e?.target;
        const scrollY =
          (target && typeof target.scrollTop === 'number' ? target.scrollTop : 0) ||
          window.scrollY ||
          document.documentElement.scrollTop ||
          (mainWrapperRef.current ? mainWrapperRef.current.scrollTop : 0);

        if (scrollY > 20) {
          setIsPosNavbarHidden((prev) => (prev ? prev : true));
        } else if (scrollY <= 2) {
          setIsPosNavbarHidden((prev) => (!prev ? prev : false));
        }
        ticking = false;
      });
    };

    const handleWheel = (e) => {
      // Ignore tiny unintentional wheel movements (< 8px)
      if (Math.abs(e.deltaY) < 8) return;

      if (e.deltaY > 15) {
        setIsPosNavbarHidden((prev) => (prev ? prev : true));
      } else if (e.deltaY < -15) {
        // When scrolling up, check if near top
        const wrapper = mainWrapperRef.current;
        const scrollY =
          window.scrollY ||
          document.documentElement.scrollTop ||
          (wrapper ? wrapper.scrollTop : 0);
        if (scrollY <= 8) {
          setIsPosNavbarHidden((prev) => (!prev ? prev : false));
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('wheel', handleWheel, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true, capture: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('wheel', handleWheel);
      document.removeEventListener('scroll', handleScroll, { passive: true, capture: true });
    };
  }, [isPosRoute]);

  return (
    <div
      className={`min-h-screen bg-stone-100 flex flex-col antialiased text-stone-900 ${
        isPosRoute ? 'lg:h-screen lg:overflow-hidden' : ''
      }`}
    >
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-stone-900/40 z-30 lg:hidden backdrop-blur-xs"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Responsive Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-stone-900 text-stone-300 flex flex-col border-r border-stone-800 transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Sidebar Brand */}
        <div className="h-18 px-6 flex items-center justify-between border-b border-stone-800">
          <Link to="/admin" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-salon-800 to-amber-700 text-white flex items-center justify-center shadow-md shadow-salon-800/30">
              <Sparkles className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <span className="font-display font-bold text-white text-base tracking-tight block">
                {config.SALON_NAME}
              </span>
              <span className="text-[10px] tracking-widest text-salon-400 font-semibold uppercase block -mt-1">
                Admin Console
              </span>
            </div>
          </Link>

          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-stone-400 hover:text-white p-1 rounded-lg"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>


        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.path === '/admin'
                ? location.pathname === '/admin'
                : location.pathname.startsWith(item.path);

            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (window.innerWidth < 1024) setSidebarOpen(false);
                }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-salon-800 text-white shadow-sm font-semibold'
                    : 'text-stone-400 hover:text-white hover:bg-stone-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-stone-400'}`} />
                <span className="flex-1">{item.label}</span>
                {/* Live unread badge on sidebar items (e.g. Appointments) */}
                {item.badge > 0 && (
                  <span
                    className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold leading-none ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-rose-500 text-white animate-pulse'
                    }`}
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-stone-800 space-y-1">
          <Link
            to="/"
            target="_blank"
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-stone-400 hover:text-stone-200 hover:bg-stone-800/40 transition-colors"
          >
            <ExternalLink className="w-4 h-4 text-stone-400" />
            <span>Open Customer Site</span>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-950/30 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Wrapper with Sidebar Offset */}
      <div
        ref={mainWrapperRef}
        className={`lg:pl-64 flex flex-col flex-1 ${
          isPosRoute ? 'h-screen overflow-y-auto scrollbar-none scroll-smooth' : 'min-h-screen'
        }`}
      >
        {/* Top Header: smoothly hides when POS page is scrolled, returns when on top (scroll is 0) */}
        <header
          className={`shrink-0 sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200/90 flex items-center justify-between px-4 sm:px-6 shadow-xs will-change-[transform,margin,opacity] transition-[transform,margin,opacity] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isPosRoute && isPosNavbarHidden
              ? '-translate-y-full -mb-16 opacity-0 pointer-events-none'
              : 'translate-y-0 mb-0 opacity-100'
          }`}
          style={{ height: '64px' }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors lg:hidden"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <span className="text-xs font-medium text-stone-500 hidden sm:inline-block">
              {config.SALON_NAME} &bull; Management Console
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-stone-600 hover:text-salon-800 font-medium px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 transition-colors"
            >
              <span>Customer Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            {/* Live Appointment Notification Bell — receives shared poller data */}
            <NotificationBell
              sharedUnreadCount={unreadCount}
              sharedNotifications={notifications}
              sharedMarkAsRead={markAsRead}
              sharedMarkAllRead={markAllRead}
            />

            <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-stone-200">
              <div className="w-8 h-8 rounded-full bg-salon-100 border border-salon-300 text-salon-800 font-sans flex items-center justify-center text-xs font-bold shadow-xs">
                {user?.name ? user.name[0].toUpperCase() : 'A'}
              </div>
              <div className="hidden sm:block text-left">
                <span className="block text-xs font-bold text-stone-900 leading-tight">
                  {user?.name || 'Staff Member'}
                </span>
                <span className="block text-[10px] text-stone-500 capitalize">{role?.toLowerCase()}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Quick reveal button when navbar is hidden on POS */}
        {isPosRoute && isPosNavbarHidden && (
          <button
            type="button"
            onClick={() => {
              setIsPosNavbarHidden(false);
              if (mainWrapperRef.current) mainWrapperRef.current.scrollTo({ top: 0, behavior: 'smooth' });
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            title="Click or scroll to top to show navbar"
            className="fixed top-1.5 left-1/2 -translate-x-1/2 z-40 bg-stone-900/85 hover:bg-stone-900 text-stone-200 hover:text-white px-3 py-1 rounded-full text-[11px] font-medium flex items-center gap-1.5 shadow-lg backdrop-blur-xs transition-all duration-200 cursor-pointer active:scale-95 border border-stone-700/50"
          >
            <ChevronDown className="w-3.5 h-3.5 text-gold-400" />
            <span>Show Navbar</span>
          </button>
        )}

        {/* Content Outlet */}
        <main
          className={`flex-1 max-w-7xl w-full mx-auto ${
            isPosRoute
              ? 'p-2 sm:p-2.5 lg:p-3 overflow-hidden flex flex-col min-h-0'
              : 'p-4 sm:p-6 lg:p-8'
          }`}
        >
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>

      <ToastContainer />
    </div>
  );
}

export default AdminLayout;
