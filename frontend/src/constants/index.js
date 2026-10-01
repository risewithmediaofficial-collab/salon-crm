export {
  ROLES,
  APPOINTMENT_STATUS,
  VALID_TRANSITIONS,
  SERVICE_CATEGORY,
  INVOICE_STATUS,
  PAYMENT_METHOD,
  DAYS_OF_WEEK,
  OFFER_TYPE,
  CURRENCY,
  SALON_DEFAULTS,
} from '../../../shared/constants/index.js';

export const STATUS_COLORS = Object.freeze({
  PENDING: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  ACCEPTED: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
  },
  CONFIRMED: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    dot: 'bg-indigo-500',
  },
  ARRIVED: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    dot: 'bg-purple-500',
  },
  IN_SERVICE: {
    bg: 'bg-cyan-50',
    text: 'text-cyan-700',
    border: 'border-cyan-200',
    dot: 'bg-cyan-500',
  },
  COMPLETED: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  CANCELLED: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
  },
  REJECTED: {
    bg: 'bg-stone-100',
    text: 'text-stone-700',
    border: 'border-stone-200',
    dot: 'bg-stone-500',
  },
  NO_SHOW: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    dot: 'bg-red-500',
  },
  RESCHEDULED: {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    dot: 'bg-orange-500',
  },
});

export const INVOICE_STATUS_COLORS = Object.freeze({
  DRAFT: { bg: 'bg-stone-100', text: 'text-stone-700', border: 'border-stone-200' },
  ISSUED: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  PAID: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  PARTIALLY_PAID: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  REFUNDED: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  CANCELLED: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
});
