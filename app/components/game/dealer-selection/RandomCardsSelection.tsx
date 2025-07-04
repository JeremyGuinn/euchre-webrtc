import type { Card, Player } from '../../../types/game';
import { CardBack, Card as CardComponent } from '../Card';

interface RandomCardsSelectionProps {
  players: Player[];
  myPlayer: Player;
  isVisible: boolean;
  dealerSelectionCards?: Record<string, Card>;
  onCardPicked?: (cardIndex: number) => void;
  onComplete: () => void;
}

export function RandomCardsSelection({
  players,
  myPlayer,
  isVisible,
  dealerSelectionCards,
  onCardPicked,
  onComplete: _onComplete,
}: RandomCardsSelectionProps) {
  const getPlayerPosition = (player: Player, myPosition: number) => {
    const relativePosition = (player.position - myPosition + 4) % 4;
    switch (relativePosition) {
      case 0:
        return 'bottom';
      case 1:
        return 'left';
      case 2:
        return 'top';
      case 3:
        return 'right';
      default:
        return 'bottom';
    }
  };

  const getPositionClasses = (position: string) => {
    switch (position) {
      case 'bottom':
        return 'absolute bottom-8 left-1/2 transform -translate-x-1/2';
      case 'left':
        return 'absolute left-4 top-1/2 transform -translate-y-1/2';
      case 'top':
        return 'absolute top-4 left-1/2 transform -translate-x-1/2';
      case 'right':
        return 'absolute right-4 top-1/2 transform -translate-y-1/2';
      default:
        return '';
    }
  };

  if (!isVisible) return null;

  const canPickCard = !dealerSelectionCards?.[myPlayer.id];

  return (
    <div className='absolute inset-0 z-30'>
      <div className='flex flex-col items-center justify-center h-full p-8'>
        {/* Show dealt cards for each player in their positions */}
        {players.map(player => {
          const position = getPlayerPosition(player, myPlayer.position);
          const drawnCard = dealerSelectionCards?.[player.id];
          const hasDrawn = !!drawnCard;
          const isMyTurn = player.id === myPlayer.id && !hasDrawn;

          return (
            <div key={player.id} className={getPositionClasses(position)}>
              <div className='text-center flex flex-col items-center'>
                <div
                  className={`inline-block px-3 py-1 rounded-lg text-sm font-medium mb-2 ${
                    isMyTurn
                      ? 'bg-yellow-500/90 text-black'
                      : 'bg-white/20 text-white'
                  }`}
                >
                  {player.name} {player.id === myPlayer.id && '(You)'}
                </div>
                <div className='w-20 h-28 border-2 border-white/30 rounded-lg flex items-center justify-center bg-green-700/50'>
                  {hasDrawn ? (
                    <CardComponent card={drawnCard} size='medium' />
                  ) : isMyTurn ? (
                    <div className='text-xs text-center text-yellow-400 font-medium'>
                      Your Turn!
                      <br />
                      Pick a Card
                    </div>
                  ) : (
                    <div className='text-xs text-center text-gray-400'>
                      {player.isConnected ? 'Waiting...' : 'Disconnected'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Spread Deck - positioned in the center */}
        {canPickCard && (
          <div className='absolute inset-0 flex items-center justify-center'>
            <div className='relative'>
              <div className='relative w-full h-48 flex items-center justify-center'>
                {/* Create array of face-down cards in spread formation */}
                {Array.from({ length: 24 }, (_, index) => {
                  const totalCards = 24;

                  // Create an arc from -60 degrees to +60 degrees (120 degree spread)
                  const maxAngle = 60; // degrees
                  const angleStep =
                    totalCards > 1 ? (2 * maxAngle) / (totalCards - 1) : 0;
                  const angle = -maxAngle + index * angleStep;

                  // Position cards along a circular arc
                  const radius = 180; // Distance from center
                  const angleRad = (angle * Math.PI) / 180;
                  const x = Math.sin(angleRad) * radius;
                  const y = (1 - Math.cos(angleRad)) * radius * 0.5;

                  return (
                    <button
                      key={index}
                      onClick={() => onCardPicked?.(index)}
                      className='absolute transition-all duration-200 hover:scale-110 hover:-translate-y-4 hover:z-30 cursor-pointer'
                      style={{
                        transform: `translate(${x}px, ${y}px) rotate(${angle}deg)`,
                        transformOrigin: 'center bottom',
                        zIndex: 10 + index,
                      }}
                    >
                      <CardBack size='medium' />
                    </button>
                  );
                })}
              </div>

              <div className='text-center text-white mt-4'>
                <p className='text-sm animate-pulse'>Click any card to draw</p>
              </div>
            </div>
          </div>
        )}

        {/* Completion message - positioned at bottom center */}
        {dealerSelectionCards &&
          Object.keys(dealerSelectionCards).length === players.length && (
            <div className='absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center text-white'>
              <div className='bg-black/70 backdrop-blur-sm px-6 py-3 rounded-lg shadow-lg border border-white/20'>
                <p className='text-lg mb-2'>All cards drawn!</p>
                <p className='text-sm text-gray-300'>
                  Determining dealer and teams...
                </p>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
