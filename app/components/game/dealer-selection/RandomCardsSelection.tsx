import type { Card, Player } from '~/types/game';
import { CardBack } from '../Card';
import DealerSelectionStatus from './DealerSelectionStatus';
import PlayerDealingArea from './PlayerDealingArea';

interface RandomCardsSelectionProps {
  players: Player[];
  myPlayer: Player;
  isVisible: boolean;
  dealerSelectionCards?: Record<string, Card>;
  onCardPicked?: (cardIndex: number) => void;
}

export function RandomCardsSelection({
  players,
  myPlayer,
  isVisible,
  dealerSelectionCards,
  onCardPicked,
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
        return 'absolute left-1/2 -translate-x-1/2 bottom-0';
      case 'left':
        return 'absolute top-1/2 -translate-y-1/2 rotate-90 translate-x-1/2';
      case 'top':
        return 'absolute left-1/2 -translate-x-1/2';
      case 'right':
        return 'absolute -rotate-90 right-0 top-1/2 -translate-y-1/2 -translate-x-1/2';
      default:
        return '';
    }
  };

  if (!isVisible) return null;

  const canPickCard = !dealerSelectionCards?.[myPlayer.id];

  return (
    <>
      {/* Show dealt cards for each player in their positions */}
      {players.map(player => {
        const position = getPlayerPosition(player, myPlayer.position);
        const drawnCard = dealerSelectionCards?.[player.id];
        const hasDrawn = !!drawnCard;
        const isMyTurn = player.id === myPlayer.id && !hasDrawn;

        return (
          <PlayerDealingArea
            key={player.id}
            player={player}
            myPlayer={myPlayer}
            position={position}
            positionClasses={getPositionClasses(position)}
            isCurrentPlayer={isMyTurn}
            cards={drawnCard ? [drawnCard] : []}
            maxCardsToShow={1}
            dealerSelectionId={`random-player-cards-${player.id}`}
            mode='random'
          />
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
                const angleStep = totalCards > 1 ? (2 * maxAngle) / (totalCards - 1) : 0;
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

      {/* Status display */}
      <DealerSelectionStatus
        method='random_cards'
        dealerFound={
          !!(dealerSelectionCards && Object.keys(dealerSelectionCards).length === players.length)
        }
        currentStep={dealerSelectionCards ? Object.keys(dealerSelectionCards).length : 0}
        totalSteps={players.length}
        currentPlayerName={canPickCard ? myPlayer.name : undefined}
      />
    </>
  );
}
