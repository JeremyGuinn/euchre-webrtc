import { useEffect, useMemo, useState } from 'react';
import { useGame } from '~/contexts/GameContext';
import { useGameUI } from '~/hooks/useGameUI';
import { useGameStore } from '~/store/gameStore';
import type { Card, Player } from '~/types/game';
import { getPlayerIdFromPosition } from '~/utils/game/playerUtils';
import CardDeck from './CardDeck';
import DealerSelectionStatus from './DealerSelectionStatus';
import { FirstBlackJackDealingAnimation } from './FirstBlackJackDealingAnimation';
import PlayerDealingArea from './PlayerDealingArea';

export function FirstBlackJackSelection() {
  const { players } = useGameStore();
  const { myPlayer } = useGameUI();
  const { gameState, isHost, dealFirstBlackJackCard, completeBlackJackDealerSelection } = useGame();

  // Animation state
  const [pendingDeal, setPendingDeal] = useState<{
    card: Card;
    playerId: string;
  } | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  // Track cards that have completed their animations and should be visible
  const [completedAnimations, setCompletedAnimations] = useState<Set<string>>(new Set());

  // Get dealing state from game context - all derived state should be in useMemo
  const dealingState = useMemo(
    () => gameState.firstBlackJackDealing,
    [gameState.firstBlackJackDealing]
  );

  // Track the last dealt card to detect new cards being dealt
  const lastDealtCard = useMemo(() => {
    const dealtCards = dealingState?.dealtCards ?? [];
    return dealtCards.length > 0 ? dealtCards[dealtCards.length - 1] : null;
  }, [dealingState?.dealtCards]);

  // Track the count of dealt cards to detect changes
  const dealtCardsCount = useMemo(() => {
    return dealingState?.dealtCards?.length ?? 0;
  }, [dealingState?.dealtCards]);

  // Detect when a new card is being dealt and trigger animation
  useEffect(() => {
    if (!lastDealtCard) return;

    const playerId = getPlayerIdFromPosition(lastDealtCard.playerPosition, players);
    if (!playerId) return; // Ensure we have a valid player ID

    // Set up the pending deal for animation
    setPendingDeal({
      card: lastDealtCard.card,
      playerId,
    });
    setIsAnimating(true);
  }, [dealtCardsCount, lastDealtCard, players]); // Use dealtCardsCount to trigger on new cards

  // Handle animation completion
  const handleAnimationComplete = () => {
    setIsAnimating(false);
    // Mark this card as completed
    if (pendingDeal) {
      setCompletedAnimations(prev =>
        new Set(prev).add(`${pendingDeal.playerId}-${pendingDeal.card.id}`)
      );

      // Check if this was a black jack card and trigger completion if host
      const isBlackJack =
        pendingDeal.card.value === 'J' &&
        (pendingDeal.card.suit === 'spades' || pendingDeal.card.suit === 'clubs');

      if (isBlackJack && isHost) {
        // Add a small delay to let the animation fully settle before transitioning
        setTimeout(() => {
          completeBlackJackDealerSelection();
        }, 500);
      }
    }
    setPendingDeal(null);
  };

  const dealingComplete = useMemo(() => gameState.phase === 'team_summary', [gameState.phase]);
  const currentPlayerIndex = useMemo(
    () => dealingState?.currentPlayerIndex ?? 0,
    [dealingState?.currentPlayerIndex]
  );
  const currentCardIndex = useMemo(
    () => dealingState?.currentCardIndex ?? 0,
    [dealingState?.currentCardIndex]
  );

  // Group dealt cards by player for display - only show cards that have completed animation
  const playerCardHistories = useMemo(() => {
    const dealtCards = dealingState?.dealtCards ?? [];

    return players.map(player => ({
      playerId: player.id,
      cards: dealtCards
        .filter(dealt => dealt.playerPosition === player.position)
        .map(dealt => dealt.card)
        .filter(
          card =>
            // Show all cards if dealing is complete, otherwise only show completed animations
            dealingComplete || completedAnimations.has(`${player.id}-${card.id}`)
        ),
    }));
  }, [players, dealingState?.dealtCards, completedAnimations, dealingComplete]);

  // Find winner (player who got a black jack) - memoized
  const blackJackWinner = useMemo(() => {
    const currentDealerId = getPlayerIdFromPosition(gameState.currentDealerPosition, players);

    return dealingComplete && currentDealerId ? players.find(p => p.id === currentDealerId) : null;
  }, [dealingComplete, gameState.currentDealerPosition, players]);

  // Memoize current player dealing calculation
  const currentPlayerDealing = useMemo(() => {
    return players[currentPlayerIndex];
  }, [players, currentPlayerIndex]);

  // Maximum number of recent cards to show per player for performance
  const MAX_CARDS_TO_SHOW = useMemo(() => 3, []);

  // Memoize position functions to avoid recreating on every render
  const getPlayerPosition = useMemo(() => {
    return (player: Player, myPosition: number) => {
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
  }, []);

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

  // Reset completed animations when component becomes visible
  useEffect(() => {
    if (!dealingComplete) {
      setCompletedAnimations(new Set());
    }
  }, [dealingComplete]);

  // Auto-deal cards with timing (only on host)
  useEffect(() => {
    if (dealingComplete || !isHost) return;
    if (!dealingState) return;

    // Stop dealing if a black jack has been found
    if (dealingState.blackJackFound) return;

    // Add initial delay before starting first card
    const initialDelay = currentCardIndex === 0 ? 125 : 0;

    const timer = setTimeout(() => {
      dealFirstBlackJackCard();
    }, initialDelay + 400); // Faster dealing - twice as fast as before

    return () => clearTimeout(timer);
  }, [dealingComplete, isHost, dealingState, currentCardIndex, dealFirstBlackJackCard]);

  if (!myPlayer) return null; // Ensure myPlayer is defined before rendering

  return (
    <>
      {/* Center deck area */}
      <div className='absolute inset-0 flex items-center justify-center pointer-events-none'>
        <div id='blackjack-dealing-center' className='relative'>
          <CardDeck id='blackjack-dealing-center' isAnimating={isAnimating} />
        </div>
      </div>

      {/* Dealing Animation */}
      <FirstBlackJackDealingAnimation
        isVisible={isAnimating}
        currentCard={pendingDeal?.card || null}
        targetPlayerId={pendingDeal?.playerId || null}
        onAnimationComplete={handleAnimationComplete}
      />

      {/* Show cards for each player in their positions */}
      {players.map(player => {
        const position = getPlayerPosition(player, myPlayer.position);
        const playerHistory = playerCardHistories.find(h => h.playerId === player.id);
        const playerCards = playerHistory?.cards || [];
        const isCurrentPlayer = currentPlayerDealing?.id === player.id && !dealingComplete;
        const isWinner = blackJackWinner?.id === player.id;

        return (
          <PlayerDealingArea
            key={player.id}
            player={player}
            myPlayer={myPlayer}
            position={position}
            positionClasses={getPositionClasses(position)}
            isCurrentPlayer={isCurrentPlayer}
            isWinner={isWinner}
            cards={playerCards}
            maxCardsToShow={MAX_CARDS_TO_SHOW}
            mode='blackjack'
            dealerSelectionId={`blackjack-player-cards-${player.id}`}
          />
        );
      })}

      {/* Central status message */}
      <div className='absolute inset-0 flex items-center justify-center pointer-events-none'>
        <DealerSelectionStatus
          dealerFound={dealingComplete || !!dealingState?.blackJackFound}
          currentStep={currentCardIndex}
          totalSteps={gameState.deck?.length ?? 52}
        />
      </div>
    </>
  );
}
