import React from 'react';
import { Calendar } from 'lucide-react';
import Button from './Button.jsx';

export function EmptyState({
  icon: Icon = Calendar,
  title = 'No records found',
  description = 'There are no items to display at this moment.',
  actionLabel,
  onAction,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-stone-200 bg-stone-50/50 ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-salon-50 border border-salon-200 flex items-center justify-center text-salon-700 mb-3.5 shadow-sm">
        <Icon className="w-6 h-6" />
      </div>

      <h3 className="text-base font-display font-bold text-stone-900 mb-1">{title}</h3>
      <p className="text-xs text-stone-500 max-w-sm mb-5">{description}</p>

      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export default React.memo(EmptyState);
