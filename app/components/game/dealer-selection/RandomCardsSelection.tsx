import { useMemo } from 'react';
import { useGame } from '~/contexts/GameContext';
import { gameStore } from '~/store/gameStore';
import { select } from '~/store/selectors/players';
import { getPositionClasses, getRelativePlayerPosition } from '~/utils/game/playerPositionUtils';
import { CardBack } from '../Card';
import PlayerDealingArea from './PlayerDealingArea';

export function RandomCardsSelection() {
  const { drawDealerCard } = useGame();

  const dealerSelectionCards = gameStore.use.dealerSelectionCards();
  const deck = gameStore.use.deck();
  const players = gameStore.use.players();
  const myPlayer = gameStore(select.myPlayer);

  const cardsRemaining = useMemo(() => {
    return deck.length - (dealerSelectionCards ? Object.keys(dealerSelectionCards).length : 0);
  }, [deck.length, dealerSelectionCards]);

  const canPickCard = useMemo(
    () => myPlayer && !dealerSelectionCards?.[myPlayer.position],
    [dealerSelectionCards, myPlayer]
  );

  if (!myPlayer) return null;

  return (
    <>
      {/* Show dealt cards for each player in their positions */}
      {players.map(player => {
        const position = getRelativePlayerPosition(player, myPlayer.position);
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

            <div className='text-center text-white mt-4 p-2 bg-black/50 rounded-lg backdrop-blur-sm border border-white/20'>
              <p className='text-sm animate-pulse'>Click any card to draw</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
