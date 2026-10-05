import React, { useState } from 'react';
import { useRouteError, isRouteErrorResponse, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Compass,
  Home,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  AlertOctagon,
  AlertCircle,
  Scissors,
  Calendar,
  Lock,
  Tag,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  LifeBuoy,
} from 'lucide-react';
import config from '../../config/index.js';

export function RouteErrorPage() {
  const error = useRouteError();
  const navigate = useNavigate();
  const location = useLocation();
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  const is404 =
    isRouteErrorResponse(error) && error.status === 404
      ? true
      : error?.status === 404 ||
        error?.statusCode === 404 ||
        (typeof error?.message === 'string' && error.message.toLowerCase().includes('not found'));

  const isAuthError =
    isRouteErrorResponse(error) && (error.status === 401 || error.status === 403);

  const statusCode = isRouteErrorResponse(error)
    ? error.status
    : is404
    ? 404
    : error?.status || 500;

  const errorMessage = isRouteErrorResponse(error)
    ? error.statusText || error.data?.message || 'Page not found'
    : error?.message || 'An unexpected application error occurred.';

  const errorStack =
    error?.stack ||
    (typeof error === 'object' ? JSON.stringify(error, null, 2) : String(error));

  const handleCopyDetails = () => {
    navigator.clipboard?.writeText(
      `URL: ${window.location.href}\nStatus: ${statusCode}\nError: ${errorMessage}\n\nStack:\n${errorStack}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReload = () => {
    window.location.reload();
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col justify-between relative overflow-hidden font-sans selection:bg-rose-500/30 selection:text-rose-200">
      {/* Ambient Error Glows */}
      {is404 ? (
        <>
          <div className="absolute -top-40 -right-40 w-[30rem] h-[30rem] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute -bottom-40 -left-40 w-[30rem] h-[30rem] bg-stone-800/20 rounded-full blur-[140px] pointer-events-none" />
        </>
      ) : (
        <>
          <div className="absolute -top-40 -right-40 w-[32rem] h-[32rem] bg-rose-600/15 rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute -bottom-40 -left-40 w-[32rem] h-[32rem] bg-red-900/20 rounded-full blur-[160px] pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[36rem] h-[36rem] bg-rose-950/15 rounded-full blur-[180px] pointer-events-none" />
        </>
      )}

      {/* Top Header Bar */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-center text-gold-400 shadow-lg shadow-black/40 group-hover:border-gold-500/50 transition-colors">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="font-display font-extrabold text-base tracking-tight text-white block">
              {config.SALON_NAME}
            </span>
            <span className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold block">
              Management & Appointment System
            </span>
          </div>
        </Link>

        <Link
          to="/staff-login"
          className="text-xs font-semibold text-stone-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-800 hover:border-stone-700 bg-stone-900/80 backdrop-blur-md transition-colors"
        >
          <Lock className="w-3.5 h-3.5 text-gold-400" />
          <span>Staff Portal</span>
        </Link>
      </header>

      {/* Main Error Centerpiece */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8 sm:px-6">
        <div className="max-w-xl w-full bg-stone-900/90 backdrop-blur-2xl border border-stone-800 rounded-3xl p-6 sm:p-9 shadow-2xl shadow-black/80 text-center relative overflow-hidden">
          {/* Top Error Alert Accent Line */}
          <div
            className={`absolute top-0 left-0 right-0 h-1.5 ${
              is404
                ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                : 'bg-gradient-to-r from-rose-500 via-red-500 to-amber-500'
            }`}
          />

          {/* Error Icon Badge */}
          <div className="mb-4 inline-flex items-center justify-center">
            {is404 ? (
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/10">
                <Compass className="w-7 h-7" />
              </div>
            ) : isAuthError ? (
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/10">
                <Lock className="w-7 h-7" />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-400 flex items-center justify-center shadow-lg shadow-rose-500/20">
                <AlertOctagon className="w-7 h-7" />
              </div>
            )}
          </div>

          {/* Status Chip */}
          <div className="mb-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide ${
                is404
                  ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
                  : isAuthError
                  ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
                  : 'bg-rose-500/15 border border-rose-500/40 text-rose-300'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>HTTP {statusCode} &bull; {is404 ? 'Not Found' : isAuthError ? 'Access Denied' : 'Application Error'}</span>
            </span>
          </div>

          {/* Large Status Number */}
          <div className="font-display font-extrabold text-6xl sm:text-7xl tracking-tight mb-2 select-none">
            <span
              className={`bg-clip-text text-transparent drop-shadow-sm ${
                is404
                  ? 'bg-gradient-to-r from-amber-300 to-orange-400'
                  : 'bg-gradient-to-r from-rose-400 via-red-500 to-amber-400'
              }`}
            >
              {statusCode}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-xl sm:text-2xl font-display font-bold text-white mb-2">
            {is404
              ? 'Page Not Found'
              : isAuthError
              ? 'Staff Authorization Required'
              : 'Something Went Wrong'}
          </h1>

          <p className="text-xs sm:text-sm text-stone-400 max-w-md mx-auto mb-4 leading-relaxed font-sans">
            {is404
              ? 'The treatment, client page, or destination you requested could not be located on the server.'
              : isAuthError
              ? 'You need authorized staff credentials to view this salon console.'
              : 'The application encountered an unexpected runtime exception.'}
          </p>

          {/* Prominent Error Details Banner */}
          {!is404 && (
            <div className="bg-rose-950/40 border border-rose-800/70 rounded-2xl p-3.5 sm:p-4 mb-6 text-left flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300 block mb-0.5">
                  Error Message
                </span>
                <p className="text-xs font-mono text-rose-100 font-semibold break-words leading-relaxed">
                  {errorMessage}
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons with High-Contrast Visibility */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 mb-6">
            {/* Go Back Button - High Contrast Crisp White Pill */}
            <button
              type="button"
              onClick={handleGoBack}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-white text-stone-900 hover:bg-stone-100 shadow-md shadow-black/20 transition-all cursor-pointer active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 text-stone-900" />
              <span>Go Back</span>
            </button>

            {/* Return to Home Button */}
            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-salon-800 hover:bg-salon-900 text-white shadow-md shadow-salon-900/30 border border-salon-700/80 transition-all cursor-pointer active:scale-95"
            >
              <Home className="w-4 h-4 text-white" />
              <span>Return to Home</span>
            </button>

            {/* Reload Page Button */}
            <button
              type="button"
              onClick={handleReload}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 transition-all cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5 text-stone-300" />
              <span>Reload</span>
            </button>
          </div>

          {/* Quick Destination Links */}
          <div className="pt-5 border-t border-stone-800/80 text-left">
            <span className="text-[10px] uppercase tracking-wider text-stone-500 font-bold block mb-2.5 text-center sm:text-left">
              Quick Navigation
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
                <span className="text-[10px] text-stone-500">Sign In</span>
              </Link>
            </div>
          </div>

          {/* Technical Diagnostics Accordion */}
          {error && (
            <div className="mt-5 pt-3.5 border-t border-stone-800/60 text-left">
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="w-full flex items-center justify-between text-[11px] text-stone-400 hover:text-stone-200 transition-colors cursor-pointer py-1 font-mono"
              >
                <span className="flex items-center gap-1.5">
                  <LifeBuoy className="w-3.5 h-3.5 text-stone-400" />
                  Technical Stack Trace & Diagnostics
                </span>
                {showDetails ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              {showDetails && (
                <div className="mt-2.5 p-3 rounded-xl bg-stone-950 border border-stone-800 text-[11px] font-mono text-stone-300 relative overflow-hidden">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-800 text-stone-500 text-[10px]">
                    <span>Path: {location.pathname}</span>
                    <button
                      type="button"
                      onClick={handleCopyDetails}
                      className="flex items-center gap-1 text-gold-400 hover:text-gold-300 cursor-pointer font-sans text-xs"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Trace</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-rose-400 font-semibold mb-1 break-words">{errorMessage}</p>
                  {errorStack && (
                    <pre className="text-[10px] text-stone-500 overflow-x-auto max-h-36 scrollbar-thin whitespace-pre-wrap">
                      {errorStack}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer Notice */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto px-6 py-4 text-center text-xs text-stone-600 font-sans">
        <p>
          &copy; {new Date().getFullYear()} {config.SALON_NAME} &bull; System Monitoring & Recovery Console
        </p>
      </footer>
    </div>
  );
}

export default RouteErrorPage;
