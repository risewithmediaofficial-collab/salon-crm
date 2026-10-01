import React from 'react';
import LoadingSpinner from './LoadingSpinner.jsx';

export function Button({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
  size = 'md', // 'sm' | 'md' | 'lg'
  isLoading = false,
  disabled = false,
  icon: Icon,
  type = 'button',
  className = '',
  onClick,
  ...props
}) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3.5 gap-2.5',
  }[size] || 'text-sm px-4 py-2.5 gap-2';

  const variantStyles = {
    primary:
      'bg-salon-800 text-white hover:bg-salon-900 focus:ring-salon-700 shadow-sm hover:shadow',
    secondary:
      'bg-white text-stone-800 border border-stone-200 hover:bg-stone-50 hover:border-stone-300 focus:ring-stone-400',
    outline:
      'bg-transparent text-salon-800 border border-salon-700 hover:bg-salon-50 focus:ring-salon-600',
    danger:
      'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500 shadow-sm hover:shadow',
    ghost:
      'bg-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-100 focus:ring-stone-400',
  }[variant] || 'bg-salon-800 text-white';

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
      onClick={onClick}
      {...props}
    >
      {isLoading ? (
        <LoadingSpinner size="sm" className={variant === 'primary' || variant === 'danger' ? 'text-white' : 'text-salon-800'} />
      ) : Icon ? (
        <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />
      ) : null}
      {children}
    </button>
  );
}

export default React.memo(Button);
