import React, { forwardRef } from 'react';

export const Input = forwardRef(function Input(
  {
    label,
    error,
    helperText,
    icon: Icon,
    endAdornment,
    className = '',
    containerClassName = '',
    id,
    type = 'text',
    required,
    ...props
  },
  ref
) {
  const inputId =
    id ||
    props.name ||
    (label ? `input-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}` : undefined);

  const handleWheel = (e) => {
    if (type === 'number') {
      e.currentTarget.blur();
    }
    props.onWheel?.(e);
  };

  return (
    <div className={`w-full ${containerClassName}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-medium text-stone-700 mb-1.5"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <div className="relative rounded-xl shadow-sm">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
            <Icon className="w-4 h-4" />
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          type={type}
          required={required}
          onWheel={handleWheel}
          className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 transition-colors focus:outline-none focus:ring-2 disabled:bg-stone-100 disabled:text-stone-500 ${
            Icon ? 'pl-10' : ''
          } ${endAdornment ? 'pr-11' : ''} ${
            error
              ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
              : 'border-stone-200 focus:border-salon-700 focus:ring-salon-100 hover:border-stone-300'
          } ${className}`}
          {...props}
        />

        {endAdornment && (
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center">
            {endAdornment}
          </div>
        )}
      </div>

      {error ? (
        <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-stone-500">{helperText}</p>
      ) : null}
    </div>
  );
});

export default React.memo(Input);
