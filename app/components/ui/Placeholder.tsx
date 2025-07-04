import React from 'react';
import { cn } from '~/utils/cn';

interface PlaceholderProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'subtle';
}

/**
 * Placeholder component for empty states with dashed borders
 * Commonly used for "waiting for player" slots or empty content areas
 *
 * @param variant - 'default' for standard gray styling, 'subtle' for lighter styling
 * @param className - Additional CSS classes
 */
export function Placeholder({
  children,
  className,
  variant = 'default',
}: PlaceholderProps) {
  const variantClasses = {
    default: 'border-gray-300 bg-gray-50',
    subtle: 'border-gray-200 bg-gray-25',
  };

  return (
    <div
      className={cn(
        'p-4 border-2 border-dashed rounded-lg',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </div>
  );
}
