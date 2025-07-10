import { useEffect, useState } from 'react';

import { useGameUI } from '~/hooks/useGameUI';
import { useGameStore } from '~/store/gameStore';
import type { Card, Player } from '~/types/game';
import { CardBack } from '../Card';

interface FirstBlackJackDealingAnimationProps {
  isVisible: boolean;
  currentCard: Card | null;
  targetPlayerId: string | null;
  onAnimationComplete: () => void;
}

interface AnimatingCard {
  id: string;
  isAnimating: boolean;
}

export function FirstBlackJackDealingAnimation({
  isVisible,
  currentCard,
  targetPlayerId,
  onAnimationComplete,
}: FirstBlackJackDealingAnimationProps) {
  const { players } = useGameStore();
  const { myPlayer } = useGameUI();

  const [animatingCard, setAnimatingCard] = useState<AnimatingCard | null>(null);

  // Start animation when a new card is being dealt
  useEffect(() => {
    if (!isVisible || !currentCard || !targetPlayerId) return;

    const cardId = `dealing-${currentCard.id}-${targetPlayerId}`;

    // Reset any existing animation
    setAnimatingCard(null);

    // Add new card and start animation
    setTimeout(() => {
      setAnimatingCard({
        id: cardId,
        isAnimating: false,
      });

      // Start animation after brief delay to ensure element is rendered
      setTimeout(() => {
        setAnimatingCard(prev => (prev ? { ...prev, isAnimating: true } : null));
      }, 25);

      // Complete animation and notify parent
      setTimeout(() => {
        setAnimatingCard(null);
        onAnimationComplete();
      }, 250); // Increased duration to match dealing timing
    }, 50); // Reduced initial delay
  }, [currentCard, targetPlayerId, isVisible, onAnimationComplete]);

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

  const getCardTargetPosition = (
    playerId: string,
    myPosition: number
  ): { x: number; y: number; rotation: number } => {
    const player = players.find(p => p.id === playerId);
    if (!player) return { x: 0, y: 0, rotation: 0 };

    const position = getPlayerPosition(player, myPosition);

    // Try to get the actual DOM position of the player's card container
    const cardContainer = document.getElementById(`blackjack-player-cards-${player.id}`);
    const centerElement = document.getElementById('blackjack-dealing-center');

    const containerRect = cardContainer?.getBoundingClientRect();
    const centerRect = centerElement?.getBoundingClientRect();

    if (!containerRect || !centerRect) {
      // Fallback positions based on player position
      switch (position) {
        case 'bottom':
          return { x: 0, y: 200, rotation: 0 };
        case 'left':
          return { x: -300, y: 0, rotation: 90 };
        case 'top':
          return { x: 0, y: -200, rotation: 0 };
        case 'right':
          return { x: 300, y: 0, rotation: -90 };
        default:
          return { x: 0, y: 0, rotation: 0 };
      }
    }

    // Calculate relative position from center
    let x = containerRect.left + containerRect.width / 2 - (centerRect.left + centerRect.width / 2);
    let y = containerRect.top + containerRect.height / 2 - (centerRect.top + centerRect.height / 2);

    // Add slight random offset for natural feel
    x += (Math.random() - 0.5) * 15;
    y += (Math.random() - 0.5) * 15;

    // Base rotation based on position, with slight random variation
    let baseRotation = 0;
    switch (position) {
      case 'left':
        baseRotation = 90;
        break;
      case 'right':
        baseRotation = -90;
        break;
      case 'bottom':
      case 'top':
      default:
        baseRotation = 0;
        break;
    }

    // Add small random rotation for natural feel
    const randomRotation = (Math.random() - 0.5) * 8; // ±4 degrees
    const rotation = baseRotation + randomRotation;

    return { x, y, rotation };
  };

  if (!isVisible || !animatingCard || !targetPlayerId || !myPlayer) return null;

  const targetPos = getCardTargetPosition(targetPlayerId, myPlayer.position);

  return (
    <div className='absolute inset-0 z-40 pointer-events-none'>
      {/* Center deck area indicator */}
      <div className='absolute inset-0 flex items-center justify-center'>
        <div id='blackjack-dealing-center' className='relative'>
          {/* Deck animation effect */}
          <div className='relative w-20 h-28'>
            <div
              className='absolute top-0 left-0 opacity-60 transition-transform duration-100'
              style={{
                transform: 'translateY(-1px) rotate(-0.5deg)',
              }}
            >
              <CardBack size='medium' />
            </div>
            <div
              className='absolute top-0.5 left-0.5 opacity-80 transition-transform duration-100'
              style={{
                transform: 'translateY(-0.5px) rotate(0.3deg)',
              }}
            >
              <CardBack size='medium' />
            </div>
            <div
              className='absolute top-1 left-1 transition-transform duration-100'
              style={{
                transform: 'translateY(-0.2px)',
              }}
            >
              <CardBack size='medium' />
            </div>
          </div>

          {/* Animating card */}
          <div
            key={animatingCard.id}
            className='absolute top-1 left-1 z-50'
            style={{
              transform: animatingCard.isAnimating
                ? `translate(${targetPos.x}px, ${targetPos.y}px) scale(0.9) rotate(${targetPos.rotation}deg)`
                : `translate(0px, 0px) scale(1) rotate(0deg)`,
              transition: animatingCard.isAnimating
                ? 'transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                : 'none',
            }}
          >
            <CardBack size='medium' />
          </div>
        </div>
      </div>
    </div>
  );
}
