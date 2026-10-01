import React, { forwardRef } from 'react';

export const Select = forwardRef(function Select(
  {
    label,
    error,
    options = [],
    placeholder = 'Select an option',
    className = '',
    containerClassName = '',
    id,
    required,
    ...props
  },
  ref
) {
  const selectId = id || props.name || Math.random().toString(36).substring(2, 9);

  return (
    <div className={`w-full ${containerClassName}`}>
      {label && (
        <label htmlFor={selectId} className="block text-xs font-medium text-stone-700 mb-1.5">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <select
        ref={ref}
        id={selectId}
        required={required}
        className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-stone-900 transition-colors focus:outline-none focus:ring-2 disabled:bg-stone-100 ${
          error
            ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
            : 'border-stone-200 focus:border-salon-700 focus:ring-salon-100 hover:border-stone-300'
        } ${className}`}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {error && <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>}
    </div>
  );
});

export default React.memo(Select);
