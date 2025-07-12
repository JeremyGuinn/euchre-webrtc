import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { cn } from '~/utils/styling/cn';

interface LinkButtonProps {
  to: string;
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' | 'text';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

export function LinkButton({
  to,
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  onClick,
}: LinkButtonProps) {
  const baseClasses = cn(
    'inline-block cursor-pointer text-center font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-lg'
  );

  const variantClasses = {
    primary: cn('bg-blue-600 hover:bg-blue-700 text-white'),
    secondary: cn('bg-gray-600 hover:bg-gray-700 text-white'),
    success: cn('bg-green-600 hover:bg-green-700 text-white'),
    danger: cn('bg-red-600 hover:bg-red-700 text-white'),
    ghost: cn('bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'),
    text: cn('text-blue-600 hover:text-blue-700 bg-transparent hover:bg-blue-50'),
  };

  const sizeClasses = {
    sm: cn('px-3 py-2 text-sm'),
    md: cn('px-6 py-3'),
    lg: cn('px-8 py-4 text-lg'),
  };

  const disabledClasses = disabled
    ? cn(
        'bg-gray-300 text-gray-500 cursor-not-allowed hover:bg-gray-300 transform-none hover:shadow-none'
      )
    : variantClasses[variant];

  const classes = cn(baseClasses, disabledClasses, sizeClasses[size], 'w-full', className);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <Link to={disabled ? '#' : to} className={classes} onClick={handleClick}>
      {children}
    </Link>
  );
}

export default LinkButton;
