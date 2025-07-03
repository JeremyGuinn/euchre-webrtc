import React from 'react';

interface GameContainerProps {
  children: React.ReactNode;
  className?: string;
}

export default function GameContainer({
  children,
  className = '',
}: GameContainerProps) {
  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-green-800 to-green-600 p-4 ${className}`}
    >
      <div className='max-w-6xl mx-auto'>{children}</div>
    </div>
  );
}
