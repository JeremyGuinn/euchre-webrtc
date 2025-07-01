import type { Card as CardType } from '../types/game';

interface CardProps {
  card: CardType;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

const suitSymbols = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣'
};

const suitColors = {
  spades: 'text-black',
  hearts: 'text-red-600',
  diamonds: 'text-red-600',
  clubs: 'text-black'
};

export function Card({ card, onClick, disabled = false, className = '', size = 'medium' }: CardProps) {
  const sizeClasses = {
    small: 'w-12 h-16 text-xs',
    medium: 'w-16 h-24 text-sm',
    large: 'w-20 h-28 text-base'
  };

  const isClickable = onClick && !disabled;

  return (
    <div
      className={`
        ${sizeClasses[size]}
        bg-white border border-gray-300 rounded-lg shadow-sm
        flex flex-col items-center justify-between p-1
        ${isClickable ? 'cursor-pointer hover:shadow-md hover:scale-105 transition-all duration-200' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      onClick={isClickable ? onClick : undefined}
    >
      <div className={`font-bold ${suitColors[card.suit]}`}>
        {card.value}
      </div>
      <div className={`text-2xl ${suitColors[card.suit]}`}>
        {suitSymbols[card.suit]}
      </div>
      <div className={`font-bold ${suitColors[card.suit]} transform rotate-180`}>
        {card.value}
      </div>
    </div>
  );
}

interface CardBackProps {
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

export function CardBack({ className = '', size = 'medium' }: CardBackProps) {
  const sizeClasses = {
    small: 'w-12 h-16',
    medium: 'w-16 h-24',
    large: 'w-20 h-28'
  };

  return (
    <div
      className={`
        ${sizeClasses[size]}
        bg-gradient-to-br from-blue-600 to-blue-800
        border border-gray-300 rounded-lg shadow-sm
        flex items-center justify-center
        ${className}
      `}
    >
      <div className="text-white text-xs font-bold opacity-50 transform rotate-45">
        EUCHRE
      </div>
    </div>
  );
}
