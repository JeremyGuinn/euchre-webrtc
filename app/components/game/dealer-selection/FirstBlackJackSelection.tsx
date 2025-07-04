import { useCallback, useEffect, useState } from 'react';
import type { Card, Player } from '~/types/game';
import { Card as CardComponent } from '../Card';
import CardDeck from './CardDeck';
import DealerSelectionStatus from './DealerSelectionStatus';
import PlayerDealingArea from './PlayerDealingArea';

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
          <CardDeck
            id='blackjack-dealing-center'
            isAnimating={animatingCards.length > 0}
          />

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
          <PlayerDealingArea
            key={player.id}
            player={player}
            myPlayer={myPlayer}
            positionClasses={getPositionClasses(position)}
            isCurrentPlayer={isCurrentPlayer}
            isWinner={isWinner}
            cards={playerCards}
            maxCardsToShow={MAX_CARDS_TO_SHOW}
            dealerSelectionId={`blackjack-player-cards-${player.id}`}
          />
        );
      })}

      {/* Central status message */}
      <div className='absolute inset-0 flex items-center justify-center pointer-events-none'>
        <DealerSelectionStatus
          method='first_black_jack'
          dealerFound={dealingComplete}
          currentStep={currentCardIndex}
          totalSteps={deck.length}
          currentPlayerName={currentPlayerDealing?.name}
        />
      </div>
    </div>
  );
}
