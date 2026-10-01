import React from 'react';

export function Skeleton({ className = '', count = 1 }) {
  if (count > 1) {
    return (
      <div className="space-y-2.5">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className={`animate-pulse rounded-xl bg-stone-200/70 ${className}`}
          />
        ))}
      </div>
    );
  }

  return <div className={`animate-pulse rounded-xl bg-stone-200/70 ${className}`} />;
}

export default React.memo(Skeleton);
