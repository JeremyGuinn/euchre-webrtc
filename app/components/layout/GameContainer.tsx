import React from 'react';
import { cn } from '~/utils/styling/cn';

interface GameContainerProps {
  children: React.ReactNode;
  className?: string;
}

export default function GameContainer({ children, className = '' }: GameContainerProps) {
  return (
    <div
      className={cn(
        `min-h-screen bg-gradient-to-br from-green-800 to-green-600 select-none`,
        className
      )}
    >
      {children}
    </div>
  );
}
