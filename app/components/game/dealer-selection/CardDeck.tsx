import { CardBack } from '../Card';

interface CardDeckProps {
  id?: string;
  isAnimating?: boolean;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export default function CardDeck({
  id,
  isAnimating = false,
  size = 'medium',
  className = '',
}: CardDeckProps) {
  return (
    <div id={id} className={`relative ${className}`}>
      {/* Deck of cards with stacked effect */}
      <div className='relative w-20 h-28'>
        <div
          className='absolute top-0 left-0 opacity-60 transition-transform duration-100'
          style={{
            transform: isAnimating ? 'translateY(-1px) rotate(-0.5deg)' : 'none',
          }}
        >
          <CardBack size={size} />
        </div>
        <div
          className='absolute top-0.5 left-0.5 opacity-80 transition-transform duration-100'
          style={{
            transform: isAnimating ? 'translateY(-0.5px) rotate(0.3deg)' : 'none',
          }}
        >
          <CardBack size={size} />
        </div>
        <div
          className='absolute top-1 left-1 transition-transform duration-100'
          style={{
            transform: isAnimating ? 'translateY(-0.2px)' : 'none',
          }}
        >
          <CardBack size={size} />
        </div>
      </div>
    </div>
  );
}
