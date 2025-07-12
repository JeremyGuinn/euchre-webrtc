import { useState } from 'react';

import { Card, CardBack } from '~/components/game/Card';
import { gameStore } from '~/store/gameStore';
import type { Card as CardType, Player } from '~/types/game';

interface PlayerHandProps {
  player: Player;
  myPlayer: Player;
  myHand: CardType[];
  isSittingOut: boolean;
  canPlay: (card: CardType) => boolean;
  isMyTurn: () => boolean;
  onCardClick: (card: CardType) => void;
  onDealerDiscard: (card: CardType) => void;
  shouldShowCards: boolean;
}

export function PlayerHand({
  player,
  myPlayer,
  myHand,
  isSittingOut,
  canPlay,
  isMyTurn,
  onCardClick,
  onDealerDiscard,
  shouldShowCards,
}: PlayerHandProps) {
  const completedTricks = gameStore.use.completedTricks();
  const currentDealerPosition = gameStore.use.currentDealerPosition();
  const currentTrick = gameStore.use.currentTrick();
  const kitty = gameStore.use.kitty();
  const phase = gameStore.use.phase();

  const [hoveredDiscardCard, setHoveredDiscardCard] = useState<CardType | null>(null);

  if (player.id === myPlayer.id) {
    // My hand - show actual cards
    return (
      <div className='flex space-x-1'>
        {myHand.map(card => {
          const isInDealerDiscardPhase =
            phase === 'dealer_discard' && myPlayer.position === currentDealerPosition;
          const isKittyCard = isInDealerDiscardPhase && kitty && card.id === kitty.id;
          const canDiscard = isInDealerDiscardPhase && !isKittyCard;
          const isHovered = isInDealerDiscardPhase && hoveredDiscardCard?.id === card.id;

          return (
            <div
              key={card.id}
              className='relative'
              role='presentation'
              onMouseEnter={() =>
                isInDealerDiscardPhase && canDiscard && setHoveredDiscardCard(card)
              }
              onMouseLeave={() => isInDealerDiscardPhase && setHoveredDiscardCard(null)}
            >
              <Card
                card={card}
                onClick={() => {
                  if (isInDealerDiscardPhase && canDiscard) {
                    onDealerDiscard(card);
                  } else if (!isInDealerDiscardPhase) {
                    onCardClick(card);
                  }
                }}
                disabled={
                  isSittingOut ||
                  (isInDealerDiscardPhase
                    ? !canDiscard
                    : !isMyTurn() || phase !== 'playing' || !canPlay(card))
                }
                className={`
                  ${
                    isSittingOut
                      ? 'opacity-30 grayscale'
                      : !canPlay(card) && isMyTurn() && phase === 'playing'
                        ? 'opacity-50'
                        : ''
                  }
                  ${isInDealerDiscardPhase && canDiscard ? 'cursor-pointer hover:scale-105 hover:-translate-y-1' : ''}
                  ${isInDealerDiscardPhase && !canDiscard ? 'opacity-60' : ''}
                  ${isHovered ? 'ring-2 ring-red-400' : ''}
                  transition-all duration-200
                `}
                size='medium'
              />
              {/* Discard overlay when hovering */}
              {isHovered && canDiscard && (
                <div className='absolute scale-110 inset-0 bg-red-500/20 rounded-lg flex items-center justify-center pointer-events-none'>
                  <div className='bg-red-600 text-white text-xs font-bold px-2 py-1 rounded transform -rotate-12 shadow-lg'>
                    DISCARD
                  </div>
                </div>
              )}

              {/* Sitting out overlay */}
              {isSittingOut && (
                <div className='absolute inset-0 bg-gray-900/40 rounded-lg flex items-center justify-center pointer-events-none'>
                  <div className='bg-gray-700 text-white text-xs font-bold px-2 py-1 rounded shadow-lg'>
                    SITTING OUT
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  } else {
    // Other players - show card backs only after cards are dealt
    if (!shouldShowCards) {
      return null;
    }

    // Calculate how many cards this player has left
    let cardsRemaining = 5; // Start with 5 cards per hand

    // Count cards played in completed tricks
    if (completedTricks) {
      const cardsPlayedInCompletedTricks = completedTricks
        .flatMap(trick => trick.cards)
        .filter(playedCard => playedCard.playerPosition === player.position).length;
      cardsRemaining -= cardsPlayedInCompletedTricks;
    }

    // Count cards played in current trick
    if (currentTrick) {
      const cardsPlayedInCurrentTrick = currentTrick.cards.filter(
        playedCard => playedCard.playerPosition === player.position
      ).length;
      cardsRemaining -= cardsPlayedInCurrentTrick;
    }

    // Ensure we don't show negative cards
    cardsRemaining = Math.max(0, cardsRemaining);

    return (
      <div className='flex space-x-1'>
        {Array.from({ length: cardsRemaining }).map((_, index) => (
          <CardBack key={index} size='small' />
        ))}
      </div>
    );
  }
}
