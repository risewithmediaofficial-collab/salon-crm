import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore.js';
import useUIStore from '../../store/uiStore.js';
import Button from '../common/Button.jsx';
import ToastContainer from '../common/ToastContainer.jsx';
import AuthModal from '../../features/auth/components/AuthModal.jsx';
import NotificationBell from '../../features/notifications/components/NotificationBell.jsx';
import ScrollToTop from '../common/ScrollToTop.jsx';
import {
  Calendar,
  Sparkles,
  Phone,
  MapPin,
  Clock,
  User,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import config from '../../config/index.js';
import ErrorBoundary from '../common/ErrorBoundary.jsx';

export function CustomerLayout() {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const role = useAuthStore((state) => state.role);
  const logout = useAuthStore((state) => state.logout);
  const openAuthModal = useUIStore((state) => state.openAuthModal);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Lock background scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  // Scroll to top and close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  // Only authenticated CUSTOMER accounts are surfaced on the customer website to keep staff/admin data completely separated
  const isCustomer = Boolean(user && role === 'CUSTOMER');

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Services', path: '/services' },
    { label: 'Our Stylists', path: '/staff' },
    { label: 'Offers', path: '/offers' },
    ...(isCustomer ? [{ label: 'My Appointments', path: '/my-appointments' }] : []),
  ];

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900">
      {/* Decorative Ambient Side Lighting Orbs (contained in fixed overlay so they never trigger horizontal scroll or break sticky navbar) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        <div className="absolute top-1/4 -left-48 w-96 h-96 rounded-full bg-amber-200/20 blur-3xl animate-float-slow" />
        <div className="absolute top-1/2 -right-48 w-96 h-96 rounded-full bg-rose-200/25 blur-3xl animate-float-reverse" />
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 rounded-full bg-salon-200/15 blur-3xl animate-pulse-slow" />
      </div>

      {/* Floating Side Quick-Book Pill (Desktop) */}
      <Link
        to="/book"
        className="hidden lg:flex fixed right-8 bottom-8 z-30 items-center gap-3 px-5 py-3.5 rounded-full bg-salon-900/90 hover:bg-salon-950 text-white shadow-premium hover:shadow-glow-salon backdrop-blur-md border border-salon-700/60 group transition-all duration-300 hover:scale-105 active:scale-95 animate-float"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
        </span>
        <span className="text-xs font-semibold tracking-wide">Book Online • Instant Confirmation</span>
        <ChevronRight className="w-4 h-4 text-gold-400 group-hover:translate-x-0.5 transition-transform" />
      </Link>

      {/* Top Banner Notice */}
      <div className="relative z-10 bg-salon-950 text-stone-200 text-xs py-2.5 px-4 text-center tracking-wide font-medium flex items-center justify-center gap-2 border-b border-salon-900/40">
        <Sparkles className="w-3.5 h-3.5 text-gold-400 animate-pulse" />
        <span>Experience Luxury Beauty & Hair Care — Book Online & Get Instant Confirmation</span>
      </div>

      {/* Main Sticky Navbar (Reduced opacity frosted glass) */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-stone-200/50 shadow-xs transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-3.5 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-salon-800 via-salon-900 to-stone-950 text-white flex items-center justify-center shadow-md shadow-salon-900/20 group-hover:scale-105 group-hover:shadow-glow-salon transition-all duration-300 border border-salon-700/50">
              <Sparkles className="w-5 h-5 text-gold-400 group-hover:rotate-12 transition-transform duration-300" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-lg text-stone-900 tracking-tight leading-tight group-hover:text-salon-800 transition-colors">
                {config.SALON_NAME}
              </span>
              <span className="text-[10px] tracking-widest text-salon-600 font-semibold uppercase">
                Luxury Parlour & Spa
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links (Pill Design) */}
          <nav className="hidden md:flex items-center gap-1.5 p-1.5 rounded-full bg-stone-100/80 border border-stone-200/70 backdrop-blur-xs">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => {
                    if (location.pathname === link.path) {
                      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
                    }
                  }}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 ${
                    isActive
                      ? 'bg-salon-900 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-white/80'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action buttons */}
          <div className="hidden md:flex items-center gap-3">
            {isCustomer ? (
              <div className="flex items-center gap-2">
                <NotificationBell />

                <div className="flex items-center gap-2 bg-stone-100/90 pl-1.5 pr-2 py-1 rounded-full border border-stone-200/80">
                  <Link to="/profile" className="flex items-center gap-2 text-xs font-semibold text-stone-800 hover:text-salon-800">
                    <div className="w-7 h-7 rounded-full bg-salon-800 text-white flex items-center justify-center font-display text-xs font-bold shadow-xs">
                      {user.name ? user.name[0].toUpperCase() : 'U'}
                    </div>
                    <span className="max-w-[110px] truncate">{user.name || 'Account'}</span>
                  </Link>

                  <button
                    onClick={logout}
                    className="p-1 rounded-full text-stone-400 hover:text-rose-600 hover:bg-white transition-colors cursor-pointer"
                    title="Logout"
                    aria-label="Logout"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                icon={User}
                onClick={() => openAuthModal('login')}
                className="text-stone-700 hover:text-stone-950 font-medium text-xs px-3.5"
              >
                Sign In
              </Button>
            )}

            <Link to="/book">
              <Button
                variant="primary"
                size="sm"
                icon={Calendar}
                className="px-4.5 py-2 text-xs font-semibold shadow-md shadow-salon-900/15 hover:shadow-lg hover:scale-[1.02] transition-all"
              >
                Book Appointment
              </Button>
            </Link>
          </div>

          {/* Mobile hamburger */}
          <div className="flex items-center gap-2 md:hidden">
            {isCustomer && <NotificationBell />}
            <Link to="/book">
              <Button variant="primary" size="sm" className="px-3 py-1.5 text-xs font-semibold">
                Book
              </Button>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="relative z-50 md:hidden border-t border-stone-200/80 bg-white/98 backdrop-blur-2xl px-6 pt-5 pb-8 space-y-4 shadow-2xl animate-in slide-in-from-top-3 duration-200">
            <div className="space-y-1.5">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      if (location.pathname === link.path) {
                        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
                      }
                    }}
                    className={`block px-4 py-3 rounded-2xl text-base font-semibold transition-all ${
                      isActive
                        ? 'bg-salon-900 text-white shadow-xs'
                        : 'text-stone-700 hover:text-stone-950 hover:bg-stone-100'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>

            <div className="pt-4 border-t border-stone-200/70 flex flex-col gap-3">
              {isCustomer ? (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-stone-100/90 text-sm font-semibold text-stone-800 hover:bg-stone-200/80 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-salon-800 text-white flex items-center justify-center font-display text-xs font-bold">
                      {user.name ? user.name[0].toUpperCase() : 'U'}
                    </div>
                    <span>My Profile ({user.name || user.phone})</span>
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
                <Button
                  variant="secondary"
                  size="md"
                  icon={User}
                  className="w-full py-3.5 text-sm font-medium"
                  onClick={() => {
                    openAuthModal('login');
                    setMobileMenuOpen(false);
                  }}
                >
                  Sign In (OTP)
                </Button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Mobile Menu Background Backdrop Overlay (locks background look and dims underlying screen) */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 top-20 bg-stone-950/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-300 pt-14 pb-10 border-t border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            {/* Salon Info */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-salon-700 to-salon-900 text-white flex items-center justify-center border border-salon-600/50">
                  <Sparkles className="w-4 h-4 text-gold-400" />
                </div>
                <h4 className="text-lg font-display font-bold text-white tracking-tight">
                  {config.SALON_NAME}
                </h4>
              </div>
              <p className="text-xs text-stone-400 leading-relaxed max-w-sm mb-4">
                Dedicated to bespoke hair styling, therapeutic skin treatments, luxury facials, and wellness rituals designed to make you look and feel extraordinary.
              </p>
              <div className="flex items-center gap-2 text-xs text-stone-400">
                <MapPin className="w-4 h-4 text-salon-400 shrink-0" />
                <span>{config.SALON_ADDRESS}</span>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-stone-200 mb-4">
                Quick Navigation
              </h5>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link to="/services" className="hover:text-white transition-colors">
                    Services & Menu
                  </Link>
                </li>
                <li>
                  <Link to="/staff" className="hover:text-white transition-colors">
                    Our Specialists
                  </Link>
                </li>
                <li>
                  <Link to="/offers" className="hover:text-white transition-colors">
                    Exclusive Packages & Offers
                  </Link>
                </li>
                <li>
                  <Link to="/book" className="hover:text-white transition-colors">
                    Book Online
                  </Link>
                </li>
              </ul>
            </div>

            {/* Hours & Contact */}
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-stone-200 mb-4">
                Salon Hours
              </h5>
              <div className="space-y-2 text-xs text-stone-400">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-salon-400 shrink-0" />
                  <span>Mon – Sat: 09:00 AM – 08:00 PM</span>
                </div>
                <p className="text-[11px] text-stone-500 pl-6">Sunday: Closed for deep sanitization</p>
                <div className="flex items-center gap-2 pt-2 text-stone-300 font-medium">
                  <Phone className="w-4 h-4 text-salon-400 shrink-0" />
                  <span>{config.SALON_PHONE}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-stone-800 text-xs text-stone-500 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>© {new Date().getFullYear()} {config.SALON_NAME}. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Global Modals, ScrollToTop & Toasts */}
      <ScrollToTop />
      <AuthModal />
      <ToastContainer />
    </div>
  );
}

export default CustomerLayout;
