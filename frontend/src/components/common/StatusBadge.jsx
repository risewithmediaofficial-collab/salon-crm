import React from 'react';
import { STATUS_COLORS } from '../../constants/index.js';

export function StatusBadge({ status, className = '' }) {
  const normalized = status ? String(status).toUpperCase() : 'PENDING';
  const theme = STATUS_COLORS[normalized] || STATUS_COLORS.PENDING;

  // Format label nicely: IN_SERVICE → In Service
  const label = normalized.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${theme.bg} ${theme.text} ${theme.border} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`} />
      {label}
    </span>
  );
}

export default React.memo(StatusBadge);
