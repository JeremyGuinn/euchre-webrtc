import type { Card, Player } from '~/types/game';
import type { Position } from '~/utils/game/playerPositionUtils';
import { Card as CardComponent } from '../Card';

interface PlayerDealingAreaProps {
  player: Player;
  myPlayer: Player;
  position: Position;
  positionClasses: string;
  isCurrentPlayer?: boolean;
  isWinner?: boolean;
  cards: Card[];
  maxCardsToShow?: number;
  dealerSelectionId?: string;
  mode?: 'blackjack' | 'random';
}

export default function PlayerDealingArea({
  player,
  myPlayer,
  position,
  positionClasses,
  isCurrentPlayer = false,
  isWinner = false,
  cards,
  maxCardsToShow = 3,
  dealerSelectionId,
  mode = 'blackjack',
}: PlayerDealingAreaProps) {
  const getPlayerLabelClass = () => {
    if (isWinner) {
      return 'bg-green-500/90 text-white animate-pulse';
    }
    if (isCurrentPlayer) {
      return 'bg-yellow-500/90 text-black';
    }
    return 'bg-white/20 text-white';
  };

  const isBlackJack = (card: Card): boolean => {
    return card.value === 'J' && (card.suit === 'spades' || card.suit === 'clubs');
  };

  return (
    <div className={positionClasses}>
      <div
        className={`text-center flex flex-col items-center gap-2 ${position === 'top' ? 'flex-col-reverse' : ''}`}
      >
        <div
          className={`inline-block text-nowrap px-3 py-1 rounded-lg text-sm font-medium transition-all duration-300 ${getPlayerLabelClass()}`}
        >
          {player.name} {player.id === myPlayer.id && '(You)'}
          {isWinner && ' - DEALER!'}
        </div>

        {/* Card area */}
        <div id={dealerSelectionId} className='relative'>
          {cards.length === 0 ? (
            <div className='w-20 h-28 border-2 border-white/30 rounded-lg flex items-center justify-center bg-green-700/50'>
              {isCurrentPlayer ? (
                mode === 'random' ? (
                  <div className='text-xs text-center text-yellow-400 font-medium'>
                    Your Turn!
                    <br />
                    Pick a Card
                  </div>
                ) : (
                  <div className='text-xs text-center text-yellow-400 font-medium animate-pulse'>
                    Dealing...
                  </div>
                )
              ) : (
                <div className='text-xs text-center text-gray-400'>
                  {mode === 'random' && !player.isConnected ? 'Disconnected' : 'Waiting...'}
                </div>
              )}
            </div>
          ) : (
            // Show cards stacked using grid
            <div className='grid grid-cols-1 grid-rows-1 place-items-center'>
              {cards.slice(-maxCardsToShow).map((card, index) => {
                const isBlackJackCard = isBlackJack(card);

                // Create consistent random offsets based on card ID
                const seed = card.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                const random1 = ((seed * 9301 + 49297) % 233280) / 233280;
                const random2 = ((seed * 9301 + 49297 + 1) % 233280) / 233280;
                const random3 = ((seed * 9301 + 49297 + 2) % 233280) / 233280;

                // Random offsets for natural stacking
                const offsetX = (random1 - 0.5) * 8 + index * 2;
                const offsetY = (random2 - 0.5) * 8 - index * 2;
                const rotation = (random3 - 0.5) * 10;

                return (
                  <div
                    key={`${card.id}-${index}`}
                    className='col-start-1 row-start-1 transition-all duration-500'
                    style={{
                      zIndex: index,
                      transform: `translate(${offsetX}px, ${offsetY}px) rotate(${rotation}deg)`,
                    }}
                  >
                    <CardComponent
                      card={card}
                      size='medium'
                      className={
                        isBlackJackCard && mode === 'blackjack'
                          ? 'ring-4 ring-green-400 ring-opacity-75'
                          : ''
                      }
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
