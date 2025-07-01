import React from 'react';

export type ButtonVariant = 'primary' | 'success' | 'danger' | 'secondary' | 'text' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  className = '',
  children,
  ...props
}) => {
  const baseClasses = 'font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer transform hover:scale-105 hover:shadow-lg';
  
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500',
    text: 'text-blue-600 hover:text-blue-700 bg-transparent hover:bg-blue-50 focus:ring-blue-500',
    ghost: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-gray-500'
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3'
  };

  const disabledClasses = 'bg-gray-300 text-gray-500 cursor-not-allowed hover:bg-gray-300 transform-none hover:shadow-none';
  const loadingClasses = 'cursor-not-allowed transform-none hover:shadow-none';

  const classes = [
    baseClasses,
    fullWidth ? 'w-full' : '',
    (disabled || loading) ? disabledClasses : variantClasses[variant],
    loading ? loadingClasses : '',
    sizeClasses[size],
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2"></div>
          {children}
        </div>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
