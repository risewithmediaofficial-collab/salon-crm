import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Compass,
  Home,
  ArrowLeft,
  Sparkles,
  Scissors,
  Calendar,
  Lock,
  Tag,
  Search,
} from 'lucide-react';
import Button from './Button.jsx';
import config from '../../config/index.js';

export function NotFoundPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const isStaffPath =
    location.pathname.startsWith('/staff') ||
    location.pathname.startsWith('/admin') ||
    location.pathname.includes('login');

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col justify-between relative overflow-hidden font-sans selection:bg-gold-500/30 selection:text-gold-200">
      {/* Ambient Luxury Glow Effects */}
      <div className="absolute -top-40 -right-40 w-[32rem] h-[32rem] bg-gold-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-[32rem] h-[32rem] bg-salon-700/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-salon-900/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-stone-900 border border-gold-500/30 flex items-center justify-center text-gold-400 shadow-lg shadow-black/40 group-hover:border-gold-500/60 transition-colors">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="font-display font-extrabold text-base tracking-tight text-white block">
              {config.SALON_NAME}
            </span>
            <span className="text-[10px] uppercase tracking-widest text-gold-400 font-semibold block">
              Luxury Salon & Spa Sanctuary
            </span>
          </div>
        </Link>

        <Link
          to="/staff-login"
          className="text-xs font-semibold text-stone-400 hover:text-gold-300 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-800 hover:border-stone-700 bg-stone-900/60 backdrop-blur-md transition-colors"
        >
          <Lock className="w-3.5 h-3.5 text-gold-400" />
          <span>Staff Portal</span>
        </Link>
      </header>

      {/* Main Luxury 404 Sanctuary Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8 sm:px-6">
        <div className="max-w-xl w-full bg-stone-900/80 backdrop-blur-2xl border border-stone-800/90 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-black/60 text-center relative">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-800/80 border border-stone-700/60 text-xs font-medium mb-6">
            <Compass className="w-3.5 h-3.5 text-gold-400 animate-spin-slow" />
            <span className="text-gold-300 font-semibold">Error 404</span>
            <span className="text-stone-400">&bull; Destination Not Found</span>
          </div>

          {/* Large Hero Code */}
          <div className="font-display font-extrabold text-7xl sm:text-8xl tracking-tight mb-2 select-none">
            <span className="bg-gradient-to-r from-gold-300 via-amber-200 to-gold-500 bg-clip-text text-transparent drop-shadow-sm">
              404
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-display font-bold text-white mb-3">
            Page Not Found in our Sanctuary
          </h1>

          <p className="text-xs sm:text-sm text-stone-400 max-w-md mx-auto mb-6 leading-relaxed font-sans">
            The page <code className="text-gold-300 font-mono bg-stone-800/80 px-2 py-0.5 rounded-md">{location.pathname}</code> does not exist or may have been relocated.
          </p>

          {/* Special staff login helper banner if they attempted a staff/admin route */}
          {isStaffPath && (
            <div className="mb-6 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs text-left flex items-start gap-3">
              <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Looking for the Staff & Admin Sign-in?</span>
                <span className="text-[11px] text-amber-300/80 block mt-0.5">
                  You can securely log in to the salon management console directly below:
                </span>
                <Link
                  to="/staff-login"
                  className="inline-block mt-2 font-bold text-gold-400 hover:text-gold-300 underline"
                >
                  &rarr; Go to Staff Login Page
                </Link>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 mb-8">
            <button
              type="button"
              onClick={handleGoBack}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-white text-stone-900 hover:bg-stone-100 shadow-md shadow-black/20 transition-all cursor-pointer active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 text-stone-900" />
              <span>Go Back</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-600 text-stone-950 shadow-md shadow-amber-500/20 transition-all cursor-pointer active:scale-95"
            >
              <Home className="w-4 h-4 text-stone-950" />
              <span>Return to Home</span>
            </button>
          </div>

          {/* Quick Navigation Cards */}
          <div className="pt-6 border-t border-stone-800/80 text-left">
            <span className="text-[11px] uppercase tracking-wider text-stone-500 font-bold block mb-3 text-center sm:text-left">
              Explore Popular Destinations
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <Link
                to="/services"
                className="p-2.5 rounded-xl bg-stone-800/40 hover:bg-stone-800/80 border border-stone-800 hover:border-stone-700 transition-all flex flex-col items-center sm:items-start text-center sm:text-left group"
              >
                <Scissors className="w-4 h-4 text-gold-400 mb-1 group-hover:scale-110 transition-transform" />
                <span className="font-semibold text-stone-200">Services</span>
                <span className="text-[10px] text-stone-500">Treatments</span>
              </Link>

              <Link
                to="/book"
                className="p-2.5 rounded-xl bg-stone-800/40 hover:bg-stone-800/80 border border-stone-800 hover:border-stone-700 transition-all flex flex-col items-center sm:items-start text-center sm:text-left group"
              >
                <Calendar className="w-4 h-4 text-gold-400 mb-1 group-hover:scale-110 transition-transform" />
                <span className="font-semibold text-stone-200">Book Online</span>
                <span className="text-[10px] text-stone-500">Appointments</span>
              </Link>

              <Link
                to="/offers"
                className="p-2.5 rounded-xl bg-stone-800/40 hover:bg-stone-800/80 border border-stone-800 hover:border-stone-700 transition-all flex flex-col items-center sm:items-start text-center sm:text-left group"
              >
                <Tag className="w-4 h-4 text-gold-400 mb-1 group-hover:scale-110 transition-transform" />
                <span className="font-semibold text-stone-200">Offers</span>
                <span className="text-[10px] text-stone-500">Exclusive Deals</span>
              </Link>

              <Link
                to="/staff-login"
                className="p-2.5 rounded-xl bg-stone-800/40 hover:bg-stone-800/80 border border-stone-800 hover:border-stone-700 transition-all flex flex-col items-center sm:items-start text-center sm:text-left group"
              >
                <Lock className="w-4 h-4 text-gold-400 mb-1 group-hover:scale-110 transition-transform" />
                <span className="font-semibold text-stone-200">Staff Portal</span>
                <span className="text-[10px] text-stone-500">Salon Desk</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Notice */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto px-6 py-4 text-center text-xs text-stone-600 font-sans">
        <p>
          &copy; {new Date().getFullYear()} {config.SALON_NAME} &bull; Elegance, Wellness & Professional Haircare
        </p>
      </footer>
    </div>
  );
}

export default NotFoundPage;
