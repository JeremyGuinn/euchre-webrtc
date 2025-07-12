import { useState } from 'react';

import { Card, CardBack } from '~/components/game/Card';
import { gameStore } from '~/store/gameStore';
import type { Card as CardType, Player } from '~/types/game';
import { reorderArray } from '~/utils/dragDrop';
import { sortCards, sortCardsBySuit } from '~/utils/game/cardSorting';
import { cn } from '~/utils/styling/cn';

interface PlayerHandProps {
  player: Player;
  myPlayer: Player;
  myHand: CardType[];
  isSittingOut: boolean;
  canPlay: (card: CardType) => boolean;
  isMyTurn: () => boolean;
  onCardClick: (card: CardType) => void;
  onDealerDiscard: (card: CardType) => void;
  onReorderHand: (newOrder: CardType[]) => void;
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
  onReorderHand,
  shouldShowCards,
}: PlayerHandProps) {
  const completedTricks = gameStore.use.completedTricks();
  const currentDealerPosition = gameStore.use.currentDealerPosition();
  const currentTrick = gameStore.use.currentTrick();
  const kitty = gameStore.use.kitty();
  const phase = gameStore.use.phase();
  const trump = gameStore.use.trump();

  const [hoveredDiscardCard, setHoveredDiscardCard] = useState<CardType | null>(null);
  const [draggedCardIndex, setDraggedCardIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isSorting, setIsSorting] = useState(false);

  const handleAutoSort = (useTrump: boolean = true) => {
    setIsSorting(true);
    const sortedCards = useTrump && trump ? sortCards(myHand, trump) : sortCardsBySuit(myHand);
    onReorderHand(sortedCards);

    // Reset sorting state after animation
    setTimeout(() => setIsSorting(false), 600);
  };

  const handleDragStart = (e: React.DragEvent, cardIndex: number) => {
    setDraggedCardIndex(cardIndex);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', cardIndex.toString());
  };

  const handleDragOver = (e: React.DragEvent, cardIndex: number) => {
    e.preventDefault();
    setDragOverIndex(cardIndex);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedCardIndex === null || draggedCardIndex === dropIndex) {
      setDraggedCardIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newOrder = reorderArray(myHand, draggedCardIndex, dropIndex);
    onReorderHand(newOrder);

    setDraggedCardIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedCardIndex(null);
    setDragOverIndex(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, cardIndex: number) => {
    if (!player || player.id !== myPlayer.id || isSittingOut) return;

    const isInDealerDiscardPhase =
      phase === 'dealer_discard' && myPlayer.position === currentDealerPosition;
    if (isInDealerDiscardPhase) return;

    // Allow reordering with keyboard: Alt + Arrow Left/Right
    if (e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      e.preventDefault();

      const newIndex =
        e.key === 'ArrowLeft'
          ? Math.max(0, cardIndex - 1)
          : Math.min(myHand.length - 1, cardIndex + 1);

      if (newIndex !== cardIndex) {
        const newOrder = reorderArray(myHand, cardIndex, newIndex);
        onReorderHand(newOrder);
      }
    }
  };

  if (player.id === myPlayer.id) {
    // My hand - show actual cards with drag and drop functionality
    return (
      <div className='flex flex-col space-y-2'>
        {/* Cards Container with Sort Controls */}
        <div className='relative group'>
          {/* Floating Sort Controls */}
          {!phase.includes('discard') && !isSittingOut && myHand.length > 1 && (
            <div className='absolute -top-4 -right-1 z-10 flex space-x-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all duration-300 ease-out'>
              <button
                onClick={() => handleAutoSort(true)}
                className={cn(
                  'w-6 h-6 rounded-full text-xs font-bold shadow-md border transition-all duration-200 backdrop-blur-sm',
                  trump
                    ? 'bg-blue-500/90 hover:bg-blue-600 text-white border-blue-300 hover:border-blue-400 hover:scale-110 hover:shadow-lg active:scale-95'
                    : 'bg-gray-300/80 text-gray-500 border-gray-300 cursor-not-allowed opacity-60'
                )}
                title={trump ? `Sort by trump (${trump}) and suit` : 'Trump not set yet'}
                disabled={!trump}
                aria-label={trump ? `Sort by trump ${trump} and suit` : 'Trump sort unavailable'}
              >
                T
              </button>
              <button
                onClick={() => handleAutoSort(false)}
                className='w-6 h-6 rounded-full text-xs font-bold bg-gray-500/90 hover:bg-gray-600 text-white border border-gray-300 hover:border-gray-400 shadow-md backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:shadow-lg active:scale-95'
                title='Sort by suit only'
                aria-label='Sort by suit'
              >
                S
              </button>
            </div>
          )}

          {/* Cards */}
          <div
            className={cn(
              'flex space-x-1 transition-all duration-300',
              isSorting && 'animate-pulse scale-[1.02]'
            )}
          >
            {myHand.map((card, index) => {
              const isInDealerDiscardPhase =
                phase === 'dealer_discard' && myPlayer.position === currentDealerPosition;
              const isKittyCard = isInDealerDiscardPhase && kitty && card.id === kitty.id;
              const canDiscard = isInDealerDiscardPhase && !isKittyCard;
              const isHovered = isInDealerDiscardPhase && hoveredDiscardCard?.id === card.id;
              const isDragging = draggedCardIndex === index;
              const isDragOver =
                dragOverIndex === index && draggedCardIndex !== null && draggedCardIndex !== index;
              const canDrag = !isInDealerDiscardPhase && !isSittingOut;

              return (
                <div
                  key={card.id}
                  className={cn(
                    'relative transition-all duration-200',
                    isDragging && 'opacity-50 scale-95 rotate-2',
                    isDragOver && 'transform translate-x-2 scale-105',
                    canDrag && 'hover:cursor-grab active:cursor-grabbing'
                  )}
                  role='presentation'
                  draggable={canDrag}
                  aria-label={
                    canDrag
                      ? `Card ${index + 1}: ${card.value} of ${card.suit}. Drag to reorder hand, or press Alt+Arrow keys.`
                      : undefined
                  }
                  onDragStart={e => canDrag && handleDragStart(e, index)}
                  onDragOver={e => canDrag && handleDragOver(e, index)}
                  onDragLeave={canDrag ? handleDragLeave : undefined}
                  onDrop={e => canDrag && handleDrop(e, index)}
                  onDragEnd={canDrag ? handleDragEnd : undefined}
                  onKeyDown={e => handleKeyDown(e, index)}
                  tabIndex={canDrag ? 0 : -1}
                  onMouseEnter={() =>
                    isInDealerDiscardPhase && canDiscard && setHoveredDiscardCard(card)
                  }
                  onMouseLeave={() => isInDealerDiscardPhase && setHoveredDiscardCard(null)}
                >
                  {/* Drop indicator */}
                  {isDragOver && (
                    <div className='absolute -left-2 top-0 bottom-0 w-1 bg-blue-500 rounded-full shadow-lg z-10 animate-pulse' />
                  )}
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
                    className={cn(
                      'transition-all duration-200',
                      isSittingOut && 'opacity-30 grayscale',
                      !canPlay(card) &&
                        isMyTurn() &&
                        phase === 'playing' &&
                        !isSittingOut &&
                        'opacity-50',
                      isInDealerDiscardPhase &&
                        canDiscard &&
                        'cursor-pointer hover:scale-105 hover:-translate-y-1',
                      isInDealerDiscardPhase && !canDiscard && 'opacity-60',
                      isHovered && 'ring-2 ring-red-400',
                      isDragging && 'cursor-grabbing'
                    )}
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
        </div>
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
