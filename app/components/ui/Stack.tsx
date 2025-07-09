import React from 'react';
import { cn } from '~/utils/cn';

interface StackProps {
  children: React.ReactNode;
  spacing?: '1' | '2' | '3' | '4' | '5' | '6' | '8';
  className?: string;
  as?: React.ElementType;
}

const spacingMap = {
  '1': 'space-y-1',
  '2': 'space-y-2',
  '3': 'space-y-3',
  '4': 'space-y-4',
  '5': 'space-y-5',
  '6': 'space-y-6',
  '8': 'space-y-8',
} as const;

/**
 * Stack component for consistent vertical spacing using space-y utilities
 *
 * @param spacing - The spacing value (maps to space-y-{value})
 * @param as - HTML element to render as (default: 'div')
 * @param className - Additional CSS classes
 */
export function Stack({ children, spacing = '4', className, as: Component = 'div' }: StackProps) {
  const spacingClass = spacingMap[spacing];

  return <Component className={cn(spacingClass, className)}>{children}</Component>;
}
