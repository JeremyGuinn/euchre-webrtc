import { cn } from '~/utils/styling/cn';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'white' | 'gray';
  className?: string;
}

/**
 * Spinner component for loading states
 *
 * @param size - Size of the spinner: 'sm' (16px), 'md' (20px), 'lg' (48px)
 * @param color - Color variant: 'primary' (blue), 'white', 'gray'
 * @param className - Additional CSS classes
 */
export function Spinner({ size = 'md', color = 'primary', className }: SpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-12 w-12',
  };

  const colorClasses = {
    primary: 'border-blue-600',
    white: 'border-white',
    gray: 'border-gray-600',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-b-2',
        sizeClasses[size],
        colorClasses[color],
        className
      )}
    />
  );
}
