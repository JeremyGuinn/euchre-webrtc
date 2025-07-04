import React from 'react';
import { cn } from '~/utils/cn';

interface StackProps {
  children: React.ReactNode;
  spacing?: '1' | '2' | '3' | '4' | '5' | '6' | '8';
  className?: string;
  as?: React.ElementType;
}

/**
 * Stack component for consistent vertical spacing using space-y utilities
 *
 * @param spacing - The spacing value (maps to space-y-{value})
 * @param as - HTML element to render as (default: 'div')
 * @param className - Additional CSS classes
 */
export function Stack({
  children,
  spacing = '4',
  className,
  as: Component = 'div',
}: StackProps) {
  const spacingClass = `space-y-${spacing}`;

  return (
    <Component className={cn(spacingClass, className)}>{children}</Component>
  );
}
