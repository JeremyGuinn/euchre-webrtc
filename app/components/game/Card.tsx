import type { Card as CardType } from '~/types/game';

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
  clubs: '♣',
};

const suitColors = {
  spades: 'text-black',
  hearts: 'text-red-600',
  diamonds: 'text-red-600',
  clubs: 'text-black',
};

export function Card({
  card,
  onClick,
  disabled = false,
  className = '',
  size = 'medium',
}: CardProps) {
  // Validation logging
  if (!card || !card.value || !card.suit) {
    return null;
  }

  if (!suitSymbols[card.suit]) {
    return null;
  }

  const sizeClasses = {
    small: 'w-12 h-16',
    medium: 'w-16 h-24',
    large: 'w-20 h-28',
  };

  const textSizes = {
    small: { value: 'text-xs', suit: 'text-md' },
    medium: { value: 'text-sm', suit: 'text-2xl' },
    large: { value: 'text-base', suit: 'text-3xl' },
  };

  const isClickable = onClick && !disabled;

  const handleClick = () => {
    if (!onClick) {
      return;
    }

    if (disabled) {
      return;
    }

    onClick();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (isClickable && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      className={`
        ${sizeClasses[size]}
        bg-white border border-gray-300 rounded-lg shadow-sm
        flex flex-col items-center justify-between p-1
        ${
          isClickable
            ? 'cursor-pointer hover:shadow-md hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500'
            : ''
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={isClickable ? 0 : -1}
      role={isClickable ? 'button' : undefined}
      aria-label={isClickable ? `Play ${card.value} of ${card.suit}` : undefined}
    >
      <div className={`font-bold ${suitColors[card.suit]} ${textSizes[size].value}`}>
        {card.value}
      </div>
      <div className={`${suitColors[card.suit]} ${textSizes[size].suit}`}>
        {suitSymbols[card.suit]}
      </div>
      <div
        className={`font-bold ${suitColors[card.suit]} transform rotate-180 ${textSizes[size].value}`}
      >
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
    large: 'w-20 h-28',
  };

  const textSizes = {
    small: { value: 'text-[.625rem]' },
    medium: { value: 'text-sm' },
    large: { value: 'text-base' },
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
      <div
        className={`text-white font-bold opacity-50 transform rotate-45 ${textSizes[size].value}`}
      >
        EUCHRE
      </div>
    </div>
  );
}
