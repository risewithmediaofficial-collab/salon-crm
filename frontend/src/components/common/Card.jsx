import React from 'react';

export function Card({ children, className = '', hover = false, onClick, ...props }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border border-stone-200/90 shadow-soft p-5 transition-all duration-200 ${
        hover ? 'hover:shadow-md hover:border-salon-300 hover:-translate-y-0.5 cursor-pointer' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export default React.memo(Card);
