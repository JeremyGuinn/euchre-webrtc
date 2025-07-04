import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

export type PanelVariant = 'default' | 'compact' | 'large' | 'modal';
export type PanelShadow = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface PanelProps {
  children: ReactNode;
  variant?: PanelVariant;
  shadow?: PanelShadow;
  className?: string;
  backdrop?: boolean;
  maxWidth?: string;
  overflow?: 'visible' | 'hidden' | 'auto';
}

const variantStyles = {
  default: cn('bg-white rounded-lg p-8'),
  compact: cn('bg-white rounded-lg p-4'),
  large: cn('bg-white rounded-xl p-12'),
  modal: cn('bg-white/95 backdrop-blur-sm rounded-xl p-8'),
};

const shadowStyles = {
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  '2xl': 'shadow-2xl',
};

const Panel = ({
  children,
  variant = 'default',
  shadow = 'lg',
  className = '',
  backdrop = false,
  maxWidth,
  overflow = 'visible',
  ...props
}: PanelProps & React.HTMLAttributes<HTMLDivElement>) => {
  const baseClasses = cn(
    variantStyles[variant],
    shadowStyles[shadow],
    backdrop && 'backdrop-blur-sm',
    maxWidth && `max-w-${maxWidth}`,
    overflow !== 'visible' && `overflow-${overflow}`,
    className
  );

  return (
    <div className={baseClasses} {...props}>
      {children}
    </div>
  );
};

export default Panel;
