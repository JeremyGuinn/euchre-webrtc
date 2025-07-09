import React from 'react';
import { cn } from '~/utils/styling/cn';

interface CenterProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  direction?: 'horizontal' | 'vertical' | 'both';
}

/**
 * Center component for flexbox centering patterns
 *
 * @param direction - 'horizontal' centers horizontally, 'vertical' centers vertically, 'both' centers both ways
 * @param as - HTML element to render as (default: 'div')
 * @param className - Additional CSS classes
 */
export function Center({
  children,
  className,
  as: Component = 'div',
  direction = 'both',
}: CenterProps) {
  const centerClasses = {
    horizontal: 'flex justify-center',
    vertical: 'flex items-center',
    both: 'flex items-center justify-center',
  };

  return <Component className={cn(centerClasses[direction], className)}>{children}</Component>;
}
