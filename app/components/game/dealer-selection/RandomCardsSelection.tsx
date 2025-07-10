import { useMemo } from 'react';
import { useGame } from '~/contexts/GameContext';
import { useGameUI } from '~/hooks/useGameUI';
import { useGameStore } from '~/store/gameStore';
import { CardBack } from '../Card';
import DealerSelectionStatus from './DealerSelectionStatus';
import PlayerDealingArea from './PlayerDealingArea';

export function RandomCardsSelection() {
  const { dealerSelectionCards } = useGameStore();
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

  const gameStore = useGameStore();
  const { drawDealerCard } = useGame();
  const { myPlayer, getPlayerPosition } = useGameUI();

  const cardsRemaining = useMemo(() => {
    return (
      gameStore.deck.length - (dealerSelectionCards ? Object.keys(dealerSelectionCards).length : 0)
    );
  }, [gameStore.deck.length, dealerSelectionCards]);

  const canPickCard = useMemo(
    () => myPlayer && !dealerSelectionCards?.[myPlayer.position],
    [dealerSelectionCards, myPlayer]
  );

  if (!myPlayer) return null;

  return (
    <>
      {/* Show dealt cards for each player in their positions */}
      {gameStore.players.map(player => {
        const position = getPlayerPosition(player);
        const drawnCard = dealerSelectionCards?.[player.position];
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
              {Array.from({ length: cardsRemaining }, (_, index) => {
                // Calculate angle for each card based on its index
                // Spread cards evenly across the arc
                // Create an arc from -60 degrees to +60 degrees (120 degree spread)
                const maxAngle = 60; // degrees
                const angleStep = cardsRemaining > 1 ? (2 * maxAngle) / (cardsRemaining - 1) : 0;
                const angle = -maxAngle + index * angleStep;

                // Position cards along a circular arc
                const radius = 180; // Distance from center
                const angleRad = (angle * Math.PI) / 180;
                const x = Math.sin(angleRad) * radius;
                const y = (1 - Math.cos(angleRad)) * radius * 0.5;

                return (
                  <button
                    key={index}
                    onClick={() => drawDealerCard(index)}
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
        dealerFound={
          !!(
            dealerSelectionCards &&
            Object.keys(dealerSelectionCards).length === gameStore.players.length
          )
        }
        currentStep={dealerSelectionCards ? Object.keys(dealerSelectionCards).length : 0}
        totalSteps={gameStore.players.length}
      />
    </>
  );
}
