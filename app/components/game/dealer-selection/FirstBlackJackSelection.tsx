import { useCallback, useEffect, useState } from 'react';
import type { Card, Player } from '~/types/game';
import { CardBack, Card as CardComponent } from '../Card';

interface FirstBlackJackSelectionProps {
  players: Player[];
  myPlayer: Player;
  isVisible: boolean;
  deck: Card[];
  onComplete: () => void;
}

interface PlayerCardHistory {
  playerId: string;
  cards: Card[];
}

interface AnimatingCard {
  id: string;
  card: Card;
  playerId: string;
  isAnimating: boolean;
}

export function FirstBlackJackSelection({
  players,
  myPlayer,
  isVisible,
  deck,
  onComplete,
}: FirstBlackJackSelectionProps) {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [playerCardHistories, setPlayerCardHistories] = useState<
    PlayerCardHistory[]
  >([]);
  const [dealingComplete, setDealingComplete] = useState(false);
  const [blackJackWinner, setBlackJackWinner] = useState<Player | null>(null);
  const [animatingCards, setAnimatingCards] = useState<AnimatingCard[]>([]);

  // Maximum number of recent cards to show per player for performance
  const MAX_CARDS_TO_SHOW = 3;

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
        return 'absolute bottom-2 left-1/2 transform -translate-x-1/2';
      case 'left':
        return 'absolute left-14 top-1/2 transform -translate-y-1/2 rotate-90 -translate-x-1/2';
      case 'top':
        return 'absolute top-14 left-1/2 transform -translate-x-1/2 -translate-y-1/2';
      case 'right':
        return 'absolute right-14 top-1/2 transform -translate-y-1/2 -rotate-90 translate-x-1/2';
      default:
        return '';
    }
  };

  const isBlackJack = (card: Card): boolean => {
    return (
      card.value === 'J' && (card.suit === 'spades' || card.suit === 'clubs')
    );
  };

  const getCardTargetPosition = (
    playerId: string
  ): { x: number; y: number; rotation: number } => {
    const player = players.find(p => p.id === playerId);
    if (!player) return { x: 0, y: 0, rotation: 0 };

    // Try to get the actual DOM position of the player's card container
    const cardContainer = document.getElementById(
      `blackjack-player-cards-${player.id}`
    );
    const centerElement = document.getElementById('blackjack-dealing-center');

    const containerRect = cardContainer?.getBoundingClientRect();
    const centerRect = centerElement?.getBoundingClientRect();

    if (!containerRect || !centerRect) {
      // Fallback if elements are not found
      return { x: 0, y: 0, rotation: 0 };
    }

    // Calculate relative position from center
    let x =
      containerRect.left +
      containerRect.width / 2 -
      (centerRect.left + centerRect.width / 2);
    let y =
      containerRect.top +
      containerRect.height / 2 -
      (centerRect.top + centerRect.height / 2);

    // Add slight random offset for natural feel
    x += (Math.random() - 0.5) * 20;
    y += (Math.random() - 0.5) * 20;

    // Random rotation for natural card landing
    const rotation = (Math.random() - 0.5) * 15; // ±7.5 degrees

    return { x, y, rotation };
  };

  const dealNextCard = useCallback(() => {
    if (
      currentCardIndex >= deck.length ||
      dealingComplete ||
      animatingCards.length > 0
    )
      return;

    const currentCard = deck[currentCardIndex];
    const currentPlayer = players[currentPlayerIndex];
    const cardId = `blackjack-${currentPlayer.id}-${currentCardIndex}`;

    const newAnimatingCard: AnimatingCard = {
      id: cardId,
      card: currentCard,
      playerId: currentPlayer.id,
      isAnimating: false,
    };

    // Add card to animation
    setAnimatingCards([newAnimatingCard]);

    // Start animation after a brief delay to ensure the element is rendered
    const startAnimationTimer = setTimeout(() => {
      setAnimatingCards(prev =>
        prev.map(card =>
          card.id === cardId ? { ...card, isAnimating: true } : card
        )
      );
    }, 25);

    // Complete animation and update game state
    const completeAnimationTimer = setTimeout(() => {
      // Add card to player's history
      setPlayerCardHistories(prev => {
        const existing = prev.find(h => h.playerId === currentPlayer.id);
        if (existing) {
          const updatedCards = [...existing.cards, currentCard];
          // Keep only the most recent cards for performance
          const recentCards = updatedCards.slice(-MAX_CARDS_TO_SHOW);

          return prev.map(h =>
            h.playerId === currentPlayer.id ? { ...h, cards: recentCards } : h
          );
        } else {
          return [
            ...prev,
            { playerId: currentPlayer.id, cards: [currentCard] },
          ];
        }
      });

      // Clear animating cards
      setAnimatingCards([]);

      // Check if this is a black jack
      if (isBlackJack(currentCard)) {
        setBlackJackWinner(currentPlayer);
        setDealingComplete(true);
        setTimeout(() => {
          onComplete();
        }, 2000); // Give time to see the winning card
        return;
      }

      // Move to next player and card
      setCurrentPlayerIndex((currentPlayerIndex + 1) % players.length);
      setCurrentCardIndex(currentCardIndex + 1);
    }, 150); // Match DealingAnimation duration

    return () => {
      clearTimeout(startAnimationTimer);
      clearTimeout(completeAnimationTimer);
    };
  }, [
    currentCardIndex,
    currentPlayerIndex,
    deck,
    players,
    dealingComplete,
    animatingCards.length,
    onComplete,
  ]);

  // Initialize card histories
  useEffect(() => {
    if (isVisible && playerCardHistories.length === 0) {
      const initialHistories = players.map(player => ({
        playerId: player.id,
        cards: [],
      }));
      setPlayerCardHistories(initialHistories);
    }
  }, [isVisible, players, playerCardHistories.length]);

  // Auto-deal cards with timing
  useEffect(() => {
    if (!isVisible || dealingComplete || animatingCards.length > 0) return;

    // Add initial delay before starting, like DealingAnimation
    const initialDelay = currentCardIndex === 0 ? 250 : 0;

    const timer = setTimeout(() => {
      dealNextCard();
    }, initialDelay + 150); // Match DealingAnimation: 250ms initial + 150ms between cards

    return () => clearTimeout(timer);
  }, [
    isVisible,
    dealingComplete,
    animatingCards.length,
    dealNextCard,
    currentCardIndex,
  ]);

  if (!isVisible) return null;

  const currentPlayerDealing = players[currentPlayerIndex];

  return (
    <div className='relative h-full'>
      {/* Center deck area */}
      <div className='absolute inset-0 flex items-center justify-center pointer-events-none'>
        <div id='blackjack-dealing-center' className='relative'>
          {/* Deck of cards in center */}
          <div className='relative w-20 h-28'>
            <div
              className='absolute top-0 left-0 opacity-60 transition-transform duration-100'
              style={{
                transform:
                  animatingCards.length > 0
                    ? 'translateY(-1px) rotate(-0.5deg)'
                    : 'none',
              }}
            >
              <CardBack size='medium' />
            </div>
            <div
              className='absolute top-0.5 left-0.5 opacity-80 transition-transform duration-100'
              style={{
                transform:
                  animatingCards.length > 0
                    ? 'translateY(-0.5px) rotate(0.3deg)'
                    : 'none',
              }}
            >
              <CardBack size='medium' />
            </div>
            <div
              className='absolute top-1 left-1 transition-transform duration-100'
              style={{
                transform:
                  animatingCards.length > 0 ? 'translateY(-0.2px)' : 'none',
              }}
            >
              <CardBack size='medium' />
            </div>
          </div>

          {/* Animating cards */}
          {animatingCards.map(animatingCard => {
            const targetPos = getCardTargetPosition(animatingCard.playerId);

            return (
              <div
                key={animatingCard.id}
                className='absolute top-1 left-1 z-50'
                style={{
                  transform: animatingCard.isAnimating
                    ? `translate(${targetPos.x}px, ${targetPos.y}px) scale(0.8) rotate(${targetPos.rotation}deg)`
                    : `translate(0px, 0px) scale(1) rotate(0deg)`,
                  transition: animatingCard.isAnimating
                    ? 'transform 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                    : 'none',
                }}
              >
                <CardComponent card={animatingCard.card} size='medium' />
              </div>
            );
          })}
        </div>
      </div>

      {/* Show cards for each player in their positions */}
      {players.map(player => {
        const position = getPlayerPosition(player, myPlayer.position);
        const playerHistory = playerCardHistories.find(
          h => h.playerId === player.id
        );
        const playerCards = playerHistory?.cards || [];
        const isCurrentPlayer =
          currentPlayerDealing?.id === player.id && !dealingComplete;
        const isWinner = blackJackWinner?.id === player.id;

        return (
          <div key={player.id} className={getPositionClasses(position)}>
            <div className='text-center flex flex-col items-center'>
              <div
                className={`inline-block px-3 py-1 rounded-lg text-sm font-medium mb-2 transition-all duration-300 ${
                  isWinner
                    ? 'bg-green-500/90 text-white animate-pulse'
                    : isCurrentPlayer
                      ? 'bg-yellow-500/90 text-black'
                      : 'bg-white/20 text-white'
                }`}
              >
                {player.name} {player.id === myPlayer.id && '(You)'}
                {isWinner && ' - DEALER!'}
              </div>

              {/* Card stack area */}
              <div
                id={`blackjack-player-cards-${player.id}`}
                className='relative'
              >
                {playerCards.length === 0 ? (
                  <div className='absolute flex items-center justify-center'>
                    {isCurrentPlayer ? (
                      <div className='text-xs text-center text-yellow-400 font-medium animate-pulse'>
                        Dealing...
                      </div>
                    ) : (
                      <div className='text-xs text-center text-gray-400'>
                        Waiting...
                      </div>
                    )}
                  </div>
                ) : (
                  // Show cards stacked on top of each other
                  playerCards.map((card, index) => {
                    const isTopCard = index === playerCards.length - 1;
                    const isBlackJackCard = isBlackJack(card);

                    // Create consistent random offsets based on card ID for stable positioning
                    const seed = card.id
                      .split('')
                      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
                    const random1 = ((seed * 9301 + 49297) % 233280) / 233280;
                    const random2 =
                      ((seed * 9301 + 49297 + 1) % 233280) / 233280;
                    const random3 =
                      ((seed * 9301 + 49297 + 2) % 233280) / 233280;

                    // Random offsets for natural stacking
                    const offsetX = (random1 - 0.5) * 8 + index * 2; // Mix random with systematic offset
                    const offsetY = (random2 - 0.5) * 8 - index * 2; // Stack upward with randomness
                    const rotation = (random3 - 0.5) * 10; // ±5 degrees rotation

                    return (
                      <div
                        key={`${card.id}-${index}`}
                        className={`absolute transition-all duration-500 transform -translate-x-1/2 ${
                          isTopCard && isCurrentPlayer ? '' : ''
                        }`}
                        style={{
                          zIndex: index,
                          transform: `translate(${offsetX}px, ${offsetY}px) rotate(${rotation}deg)`,
                        }}
                      >
                        <CardComponent
                          card={card}
                          size='medium'
                          className={`${isBlackJackCard ? 'ring-4 ring-green-400 ring-opacity-75' : ''}`}
                        />
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Central status message */}
      <div className='absolute inset-0 flex items-center justify-center pointer-events-none'>
        <div className='text-center text-white'>
          {dealingComplete ? (
            <div className='bg-black/70 backdrop-blur-sm px-6 py-4 rounded-lg shadow-lg border border-green-500/50'>
              <div className='text-lg'>
                <span className='font-semibold'>{blackJackWinner?.name}</span>{' '}
                is the dealer!
              </div>
              <div className='text-sm text-gray-300 mt-1'>
                Setting up teams and positions...
              </div>
            </div>
          ) : (
            <div className='bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg'>
              <div className='text-lg font-semibold mb-1'>
                Dealing for First Black Jack
              </div>
              <div className='text-sm text-gray-300'>
                Card {currentCardIndex + 1} • {currentPlayerDealing?.name}
                &apos;s turn
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
