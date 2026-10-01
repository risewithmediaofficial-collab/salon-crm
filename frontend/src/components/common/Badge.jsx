import React from 'react';

export function Badge({ children, variant = 'stone', className = '' }) {
  const variantStyles = {
    stone: 'bg-stone-100 text-stone-700 border-stone-200',
    salon: 'bg-salon-50 text-salon-800 border-salon-200',
    gold: 'bg-amber-50 text-amber-800 border-amber-200',
    emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    rose: 'bg-rose-50 text-rose-800 border-rose-200',
  }[variant] || 'bg-stone-100 text-stone-700 border-stone-200';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variantStyles} ${className}`}
    >
      {children}
    </span>
  );
}

export default React.memo(Badge);
