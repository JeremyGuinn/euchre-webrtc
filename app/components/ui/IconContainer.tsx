import React from 'react';
import { cn } from '~/utils/cn';

interface IconContainerProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'blue' | 'amber' | 'green' | 'red' | 'gray' | 'white';
  className?: string;
}

/**
 * IconContainer component for consistent icon backgrounds
 * Used for small containers with icons and colored backgrounds
 *
 * @param size - Size of the container: 'sm' (20px), 'md' (32px), 'lg' (40px)
 * @param variant - Color variant for background and icon
 * @param className - Additional CSS classes
 */
export function IconContainer({
  children,
  size = 'md',
  variant = 'blue',
  className,
}: IconContainerProps) {
  const sizeClasses = {
    sm: 'w-5 h-5 rounded-md',
    md: 'w-8 h-8 rounded-lg',
    lg: 'w-10 h-10 rounded-lg',
  };

  const variantClasses = {
    blue: 'bg-blue-100',
    amber: 'bg-amber-100',
    green: 'bg-green-100',
    red: 'bg-red-100',
    gray: 'bg-gray-100',
    white: 'bg-white shadow-sm',
  };

  return (
    <div
      className={cn(
        'flex items-center justify-center',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    >
      {children}
    </div>
  );
}
