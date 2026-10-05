import React from 'react';

export function Avatar({ src, name = 'U', size = 'md', className = '' }) {
  const sizeMap = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg font-medium',
    xl: 'w-20 h-20 text-2xl font-medium',
  }[size] || 'w-10 h-10 text-sm';

  const initials = (name || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`rounded-full object-cover border border-stone-200 ${sizeMap} ${className}`}
      />
    );
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center font-display font-bold bg-salon-100 text-salon-800 border border-salon-200 select-none ${sizeMap} ${className}`}
    >
      {initials}
    </div>
  );
}

export default React.memo(Avatar);
