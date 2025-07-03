import { useEffect, useState } from 'react';

import type { Card, Player } from '../../types/game';
import { CardBack, Card as CardComponent } from './Card';

interface DealerSelectionAnimationProps {
  players: Player[];
  myPlayer: Player;
  isVisible: boolean;
  method: 'first_black_jack' | 'random_cards';
  dealerSelectionCards?: Record<string, Card>;
  onCardDealt?: (playerId: string, card: Card) => void;
  onCardPicked?: (cardIndex: number) => void;
  onComplete: () => void;
}

interface DealingStep {
  playerId: string;
  cardIndex: number;
  delay: number;
  card?: Card;
}

interface AnimatingCard {
  id: string;
  playerId: string;
  cardIndex: number;
  card?: Card;
  isAnimating: boolean;
  isRevealed: boolean;
}

interface PlayerCard {
  playerId: string;
  card: Card;
  isBlackJack: boolean;
}

export function DealerSelectionAnimation({
  players,
  myPlayer,
  isVisible,
  method,
  dealerSelectionCards,
  onCardDealt,
  onCardPicked,
  onComplete,
}: DealerSelectionAnimationProps) {
  const [dealingSteps, setDealingSteps] = useState<DealingStep[]>([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [animatingCards, setAnimatingCards] = useState<AnimatingCard[]>([]);
  const [dealtCards, setDealtCards] = useState<PlayerCard[]>([]);
  const [dealerFound, setDealerFound] = useState(false);

  // Create a shuffled deck for dealer selection
  const createDealerSelectionDeck = (): Card[] => {
    const suits: Card['suit'][] = ['spades', 'hearts', 'diamonds', 'clubs'];
    const values: Card['value'][] = ['9', '10', 'J', 'Q', 'K', 'A'];
    const deck: Card[] = [];

    for (const suit of suits) {
      for (const value of values) {
        deck.push({
          id: `${suit}-${value}-${Math.random()}`,
          suit,
          value,
        });
      }
    }

    // Shuffle the deck
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    return deck;
  };

  const isBlackJack = (card: Card): boolean => {
    return (
      card.value === 'J' && (card.suit === 'spades' || card.suit === 'clubs')
    );
  };

  // Calculate dealing pattern for dealer selection
  useEffect(() => {
    if (!isVisible) return;

    const deck = createDealerSelectionDeck();
    const steps: DealingStep[] = [];
    let stepDelay = 0;
    const dealDelayMs = 800; // Slower for dramatic effect during dealer selection

    if (method === 'first_black_jack') {
      // Deal one card at a time to each player until someone gets a black jack
      let cardIndex = 0;
      let foundBlackJack = false;
      let currentPlayerIndex = 0;

      // Start from player to the left of current position 0 (which is position 1)
      const playerOrder = [1, 2, 3, 0]; // Deal in order: left, across, right, dealer

      while (!foundBlackJack && cardIndex < deck.length) {
        const positionIndex = currentPlayerIndex % 4;
        const position = playerOrder[positionIndex];
        const player = players.find(p => p.position === position);

        if (player) {
          const card = deck[cardIndex];
          steps.push({
            playerId: player.id,
            cardIndex,
            delay: stepDelay,
            card,
          });

          // Check if this card is a black jack
          if (isBlackJack(card)) {
            foundBlackJack = true;
          }

          stepDelay += dealDelayMs;
          cardIndex++;
        }

        currentPlayerIndex++;
      }
    } else {
      // Random cards method - don't create automatic dealing steps
      // Instead, we'll show a spread deck for players to pick from
      // The dealing steps will be empty for this method
    }

    setDealingSteps(steps);
    setCurrentStep(-1);
    setDealtCards([]);
    setDealerFound(false);
  }, [players, isVisible, method]);

  // Execute dealing animation
  useEffect(() => {
    if (dealingSteps.length === 0 || !isVisible) return;

    const timer = setTimeout(() => {
      setCurrentStep(0);
    }, 500); // Initial delay before starting

    return () => clearTimeout(timer);
  }, [dealingSteps, isVisible]);

  // Handle each dealing step
  useEffect(() => {
    if (currentStep < 0 || currentStep >= dealingSteps.length) return;

    const step = dealingSteps[currentStep];
    const cardId = `dealer-selection-${step.playerId}-${step.cardIndex}`;

    const newCard: AnimatingCard = {
      id: cardId,
      playerId: step.playerId,
      cardIndex: step.cardIndex,
      card: step.card,
      isAnimating: false,
      isRevealed: false,
    };

    // Add card and start animation
    setAnimatingCards(prev => [...prev, newCard]);

    // Start animation after a brief delay
    const startAnimationTimer = setTimeout(() => {
      setAnimatingCards(prev =>
        prev.map(card =>
          card.id === cardId ? { ...card, isAnimating: true } : card
        )
      );
    }, 50);

    // Reveal card after animation completes
    const revealTimer = setTimeout(() => {
      setAnimatingCards(prev =>
        prev.map(card =>
          card.id === cardId ? { ...card, isRevealed: true } : card
        )
      );

      // Add to dealt cards and notify parent
      if (step.card) {
        const playerCard: PlayerCard = {
          playerId: step.playerId,
          card: step.card,
          isBlackJack: isBlackJack(step.card),
        };

        setDealtCards(prev => [...prev, playerCard]);
        onCardDealt?.(step.playerId, step.card);

        // Check if this is a black jack for first black jack method
        if (method === 'first_black_jack' && isBlackJack(step.card)) {
          setDealerFound(true);
          // Complete after showing the black jack for a moment
          setTimeout(() => {
            onComplete();
          }, 2000);
          return;
        }
      }
    }, 400);

    // Clean up and move to next step
    const cleanupTimer = setTimeout(
      () => {
        setAnimatingCards(prev => prev.filter(card => card.id !== cardId));

        // Move to next step
        if (currentStep < dealingSteps.length - 1) {
          setCurrentStep(currentStep + 1);
        } else {
          // Animation complete for random cards method
          setTimeout(() => {
            onComplete();
          }, 1000);
        }
      },
      method === 'first_black_jack' ? 2500 : 1500
    );

    return () => {
      clearTimeout(startAnimationTimer);
      clearTimeout(revealTimer);
      clearTimeout(cleanupTimer);
    };
  }, [currentStep, dealingSteps, onComplete, onCardDealt, method]);

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

  const getCardTargetPosition = (
    playerId: string
  ): { x: number; y: number; rotation: number } => {
    const player = players.find(p => p.id === playerId);
    if (!player) return { x: 0, y: 0, rotation: 0 };

    const cardContainer = document.getElementById(
      `dealer-selection-cards-${player.id}`
    );
    const centerElement = document.getElementById('dealer-selection-center');

    const containerRect = cardContainer?.getBoundingClientRect();
    const centerRect = centerElement?.getBoundingClientRect();

    if (!containerRect || !centerRect) {
      return { x: 0, y: 0, rotation: 0 };
    }

    const x =
      containerRect.left +
      containerRect.width / 2 -
      (centerRect.left + centerRect.width / 2);
    const y =
      containerRect.top +
      containerRect.height / 2 -
      (centerRect.top + centerRect.height / 2);

    const rotation = (Math.random() - 0.5) * 10;

    return { x, y, rotation };
  };

  if (!isVisible) return null;

  // For random cards method, show interactive spread deck
  if (method === 'random_cards') {
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
                  <p className='text-sm animate-pulse'>
                    Click any card to draw
                  </p>
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

  // For first black jack method, show dealing animation
  return (
    <div className='absolute inset-0 z-30 pointer-events-none'>
      {/* Center deck area */}
      <div className='absolute inset-0 flex items-center justify-center'>
        <div id='dealer-selection-center' className='relative'>
          {/* Deck of cards in center */}
          <div className='relative w-20 h-28'>
            <div className='absolute top-0 left-0 opacity-60'>
              <CardBack size='medium' />
            </div>
            <div className='absolute top-0.5 left-0.5 opacity-80'>
              <CardBack size='medium' />
            </div>
            <div className='absolute top-1 left-1'>
              <CardBack size='medium' />
            </div>
          </div>

          {/* Animating cards */}
          {animatingCards.map(card => {
            const targetPos = getCardTargetPosition(card.playerId);

            return (
              <div
                key={card.id}
                className='absolute top-1 left-1 z-50'
                style={{
                  transform: card.isAnimating
                    ? `translate(${targetPos.x}px, ${targetPos.y}px) scale(0.9) rotate(${targetPos.rotation}deg)`
                    : `translate(0px, 0px) scale(1) rotate(0deg)`,
                  transition: card.isAnimating
                    ? 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                    : 'none',
                }}
              >
                {card.isRevealed && card.card ? (
                  <div
                    className={`transform transition-transform duration-300 ${
                      isBlackJack(card.card)
                        ? 'scale-110 ring-4 ring-yellow-400 ring-opacity-70 rounded-lg'
                        : ''
                    }`}
                  >
                    <CardComponent card={card.card} size='medium' />
                  </div>
                ) : (
                  <CardBack size='medium' />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Player areas */}
      {players.map(player => {
        const position = getPlayerPosition(player, myPlayer.position);
        const playerCards = dealtCards.filter(dc => dc.playerId === player.id);
        const hasBlackJack = playerCards.some(pc => pc.isBlackJack);

        return (
          <div key={player.id} className={getPositionClasses(position)}>
            <div className='text-center'>
              <div
                className={`inline-block px-3 py-1 rounded-lg text-sm font-medium mb-2 ${
                  hasBlackJack
                    ? 'bg-yellow-500/90 text-black font-bold'
                    : 'bg-white/20 text-white'
                }`}
              >
                {player.name} {player.id === myPlayer.id && '(You)'}
                {hasBlackJack && ' - DEALER!'}
              </div>

              {/* Show dealt cards */}
              <div
                id={`dealer-selection-cards-${player.id}`}
                className='flex justify-center'
              >
                {playerCards.map((playerCard, index) => (
                  <div
                    key={index}
                    className={`relative transition-transform duration-300 ${
                      playerCard.isBlackJack ? 'scale-110' : ''
                    }`}
                    style={{
                      zIndex: index,
                      marginLeft: index > 0 ? '-8px' : '0',
                    }}
                  >
                    <CardComponent
                      card={playerCard.card}
                      size='small'
                      className={
                        playerCard.isBlackJack ? 'ring-2 ring-yellow-400' : ''
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}

      {/* Dealing status */}
      <div className='absolute bottom-32 left-1/2 transform -translate-x-1/2 text-white text-center'>
        <div className='bg-black/70 backdrop-blur-sm px-6 py-3 rounded-lg shadow-lg border border-white/20'>
          <div className='text-lg font-medium mb-1'>
            {method === 'first_black_jack'
              ? 'Finding Dealer'
              : 'Selecting Dealer'}
          </div>
          <div className='text-sm text-gray-300'>
            {dealerFound
              ? 'Dealer found!'
              : currentStep < 0
                ? 'Preparing to deal...'
                : currentStep >= dealingSteps.length
                  ? 'Complete!'
                  : method === 'first_black_jack'
                    ? 'Dealing cards until first black jack...'
                    : 'Dealing one card to each player...'}
          </div>
        </div>
      </div>
    </div>
  );
}
