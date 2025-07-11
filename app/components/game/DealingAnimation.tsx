import { useEffect, useState } from 'react';

import { useGame } from '~/contexts/GameContext';
import { useGameStore } from '~/store/gameStore';
import { select } from '~/store/selectors/players';
import { getPositionClasses, getRelativePlayerPosition } from '~/utils/game/playerPositionUtils';
import { CardBack } from './Card';

interface DealingStep {
  playerId: string;
  cardIndex: number;
  delay: number;
}

interface AnimatingCard {
  id: string;
  playerId: string;
  cardIndex: number;
  isAnimating: boolean;
}

export function DealingAnimation() {
  const { players, currentDealerPosition } = useGameStore();
  const myPlayer = useGameStore(select.myPlayer);

  const { completeDealingAnimation } = useGame();

  const [dealingSteps, setDealingSteps] = useState<DealingStep[]>([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [animatingCards, setAnimatingCards] = useState<AnimatingCard[]>([]);

  // Calculate dealing pattern (Euchre: 3-2 pattern starting from dealer)
  useEffect(() => {
    // Find the dealer (player at position 0)
    const dealer = players.find(p => p.position === 0);
    if (!dealer) return;

    const steps: DealingStep[] = [];
    let stepDelay = 0;
    const dealDelayMs = 150; // Faster dealing - reduced from 200ms

    // Euchre dealing: Alternating pattern starting from player to left of dealer
    // First round: 2-3-2-3 cards, Second round: 3-2-3-2 cards
    // Deal starting from player to left of dealer (position 1)
    const dealingPatterns = [
      [2, 3, 2, 3], // First round
      [3, 2, 3, 2], // Second round
    ];
    let cardCounter = 0;

    for (let round = 0; round < dealingPatterns.length; round++) {
      const cardsPattern = dealingPatterns[round];

      // Deal to positions 1, 2, 3, 0 (starting from left of dealer)
      for (let positionOffset = 1; positionOffset <= 4; positionOffset++) {
        const actualPosition = positionOffset % 4; // Convert 4 to 0 for dealer
        const player = players.find(p => p.position === actualPosition);
        if (!player) continue;

        const cardsThisRound = cardsPattern[positionOffset - 1]; // Get cards for this position

        // Deal the specified number of cards to this player
        for (let cardNum = 0; cardNum < cardsThisRound; cardNum++) {
          steps.push({
            playerId: player.id,
            cardIndex: cardCounter,
            delay: stepDelay,
          });
          stepDelay += dealDelayMs;
          cardCounter++;
        }
      }
    }

    setDealingSteps(steps);
    setCurrentStep(-1);
  }, [players]);

  // Execute dealing animation
  useEffect(() => {
    if (dealingSteps.length === 0) return;

    // Start the animation sequence
    const timer = setTimeout(() => {
      setCurrentStep(0);
    }, 250); // Initial delay before starting

    return () => clearTimeout(timer);
  }, [dealingSteps]);

  // Handle each dealing step
  useEffect(() => {
    if (currentStep < 0 || currentStep >= dealingSteps.length) return;

    const step = dealingSteps[currentStep];
    const cardId = `dealing-${step.playerId}-${step.cardIndex}`;

    const newCard: AnimatingCard = {
      id: cardId,
      playerId: step.playerId,
      cardIndex: step.cardIndex,
      isAnimating: false,
    };

    // Add card and start animation
    setAnimatingCards(prev => [...prev, newCard]);

    // Start animation after a brief delay to ensure the element is rendered
    const startAnimationTimer = setTimeout(() => {
      setAnimatingCards(prev =>
        prev.map(card => (card.id === cardId ? { ...card, isAnimating: true } : card))
      );
    }, 25); // Reduced delay for snappier feel

    // Remove card from animation after it completes and move to next step
    const cleanupTimer = setTimeout(() => {
      setAnimatingCards(prev => prev.filter(card => card.id !== cardId));

      // Move to next step
      if (currentStep < dealingSteps.length) {
        setCurrentStep(currentStep + 1);

        if (currentStep + 1 >= dealingSteps.length) {
          // If last step, trigger completion callback
          setTimeout(() => {
            completeDealingAnimation();
          }, 300); // Short delay before calling onComplete
        }
      }
    }, 150);

    return () => {
      clearTimeout(startAnimationTimer);
      clearTimeout(cleanupTimer);
    };
  }, [completeDealingAnimation, currentStep, dealingSteps]);

  const getCardTargetPosition = (playerId: string): { x: number; y: number; rotation: number } => {
    const player = players.find(p => p.id === playerId);
    if (!player) return { x: 0, y: 0, rotation: 0 };

    // Try to get the actual DOM position of the player's card container
    const cardContainer = document.getElementById(`player-cards-${player.id}`);
    const centerElement = document.getElementById('dealing-center');

    const containerRect = cardContainer?.getBoundingClientRect();
    const centerRect = centerElement?.getBoundingClientRect();

    if (!containerRect || !centerRect) {
      // Fallback if elements are not found
      return { x: 0, y: 0, rotation: 0 };
    }

    // Calculate relative position from center
    let x = containerRect.left + containerRect.width / 2 - (centerRect.left + centerRect.width / 2);
    let y = containerRect.top + containerRect.height / 2 - (centerRect.top + centerRect.height / 2);

    // Add slight random offset for natural feel
    x += (Math.random() - 0.5) * 20;
    y += (Math.random() - 0.5) * 20;

    // Random rotation for natural card landing
    const rotation = (Math.random() - 0.5) * 15; // ±7.5 degrees

    return { x, y, rotation };
  };

  if (!myPlayer) return null;

  return (
    <div className='relative z-30 pointer-events-none h-full'>
      {/* Center deck area */}
      <div className='absolute inset-0 flex items-center justify-center'>
        <div id='dealing-center' className='relative'>
          {/* Deck of cards in center */}
          <div className='relative w-20 h-28'>
            <div
              className='absolute top-0 left-0 opacity-60 transition-transform duration-100'
              style={{
                transform: animatingCards.length > 0 ? 'translateY(-1px) rotate(-0.5deg)' : 'none',
              }}
            >
              <CardBack size='medium' />
            </div>
            <div
              className='absolute top-0.5 left-0.5 opacity-80 transition-transform duration-100'
              style={{
                transform: animatingCards.length > 0 ? 'translateY(-0.5px) rotate(0.3deg)' : 'none',
              }}
            >
              <CardBack size='medium' />
            </div>
            <div
              className='absolute top-1 left-1 transition-transform duration-100'
              style={{
                transform: animatingCards.length > 0 ? 'translateY(-0.2px)' : 'none',
              }}
            >
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
                    ? `translate(${targetPos.x}px, ${targetPos.y}px) scale(0.8) rotate(${targetPos.rotation}deg)`
                    : `translate(0px, 0px) scale(1) rotate(0deg)`,
                  transition: card.isAnimating
                    ? 'transform 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                    : 'none',
                }}
              >
                <CardBack size='medium' />
              </div>
            );
          })}
        </div>
      </div>

      {/* Player areas to show card count during dealing */}
      {players.map(player => {
        const position = getRelativePlayerPosition(player, myPlayer.position);
        // Count completed cards dealt to this player (not including currently animating ones)
        const cardsDealtToPlayer = dealingSteps
          .slice(0, Math.max(0, currentStep))
          .filter(step => step.playerId === player.id).length;

        return (
          <div key={player.id} className={getPositionClasses(position)}>
            <div
              className={`text-center flex flex-col items-center gap-2 ${position === 'top' ? 'flex-col-reverse' : ''}`}
            >
              <div className='inline-block text-nowrap px-3 py-1 rounded-lg text-sm font-medium mb-2 bg-white/20 text-white'>
                {player.name} {player.position === myPlayer.position && '(You)'}
                {player.position === currentDealerPosition && '(Dealer)'}
              </div>

              {/* Show card backs for dealt cards */}
              <div id={`player-cards-${player.id}`} className='flex justify-center'>
                {Array.from({ length: cardsDealtToPlayer }, (_, index) => (
                  <div
                    key={index}
                    className='relative'
                    style={{
                      zIndex: index,
                      marginLeft: index > 0 ? '-8px' : '0',
                    }}
                  >
                    <CardBack size='small' />
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
