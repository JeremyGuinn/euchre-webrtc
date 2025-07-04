import React from 'react';
import Panel from '../ui/Panel';
import { cn } from '../../utils/cn';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-6xl',
};

export default function PageContainer({
  children,
  className = '',
  maxWidth = 'md',
}: PageContainerProps) {
  return (
    <div className='min-h-screen bg-gradient-to-br from-green-800 to-green-600 flex items-center justify-center p-4'>
      <Panel
        variant="default"
        className={cn(maxWidthClasses[maxWidth], 'w-full', className)}
      >
        {children}
      </Panel>
    </div>
  );
}
