import { useEffect, useMemo, useState } from 'react';
import { useGame } from '~/contexts/GameContext';
import type { Card, Player } from '~/types/game';
import CardDeck from './CardDeck';
import DealerSelectionStatus from './DealerSelectionStatus';
import { FirstBlackJackDealingAnimation } from './FirstBlackJackDealingAnimation';
import PlayerDealingArea from './PlayerDealingArea';

interface FirstBlackJackSelectionProps {
  players: Player[];
  myPlayer: Player;
  isVisible: boolean;
  deck: Card[];
  onComplete: () => void;
}

export function FirstBlackJackSelection({
  players,
  myPlayer,
  isVisible,
  deck: _deck,
  onComplete: _onComplete,
}: FirstBlackJackSelectionProps) {
  const { gameState, isHost, dealFirstBlackJackCard } = useGame();

  // Animation state
  const [pendingDeal, setPendingDeal] = useState<{
    card: Card;
    playerId: string;
  } | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

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
    if (!lastDealtCard || !isVisible) return;

    // Set up the pending deal for animation
    setPendingDeal({
      card: lastDealtCard.card,
      playerId: lastDealtCard.playerId,
    });
    setIsAnimating(true);
  }, [dealtCardsCount, lastDealtCard, isVisible]); // Use dealtCardsCount to trigger on new cards

  // Handle animation completion
  const handleAnimationComplete = () => {
    setIsAnimating(false);
    setPendingDeal(null);
  };

  const dealingComplete = useMemo(
    () => gameState.phase === 'team_summary',
    [gameState.phase]
  );
  const currentPlayerIndex = useMemo(
    () => dealingState?.currentPlayerIndex ?? 0,
    [dealingState?.currentPlayerIndex]
  );
  const currentCardIndex = useMemo(
    () => dealingState?.currentCardIndex ?? 0,
    [dealingState?.currentCardIndex]
  );

  // Group dealt cards by player for display - memoized to avoid expensive recalculation
  const playerCardHistories = useMemo(() => {
    const dealtCards = dealingState?.dealtCards ?? [];
    return players.map(player => ({
      playerId: player.id,
      cards: dealtCards
        .filter(dealt => dealt.playerId === player.id)
        .map(dealt => dealt.card)
        .slice(-3), // Show last 3 cards for performance
    }));
  }, [players, dealingState?.dealtCards]);

  // Find winner (player who got a black jack) - memoized
  const blackJackWinner = useMemo(() => {
    return dealingComplete && gameState.currentDealerId
      ? players.find(p => p.id === gameState.currentDealerId)
      : null;
  }, [dealingComplete, gameState.currentDealerId, players]);

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

  const getPositionClasses = useMemo(() => {
    return (position: string) => {
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
  }, []);

  // Auto-deal cards with timing (only on host)
  useEffect(() => {
    if (!isVisible || dealingComplete || !isHost) return;
    if (!dealingState) return;

    // Add initial delay before starting first card
    const initialDelay = currentCardIndex === 0 ? 250 : 0;

    const timer = setTimeout(() => {
      dealFirstBlackJackCard();
    }, initialDelay + 800); // Longer delay to allow animation to complete

    return () => clearTimeout(timer);
  }, [
    isVisible,
    dealingComplete,
    isHost,
    dealingState,
    currentCardIndex,
    dealFirstBlackJackCard,
  ]);

  if (!isVisible) return null;

  return (
    <div className='relative h-full'>
      {/* Center deck area */}
      <div className='absolute inset-0 flex items-center justify-center pointer-events-none'>
        <div id='blackjack-dealing-center' className='relative'>
          <CardDeck id='blackjack-dealing-center' isAnimating={isAnimating} />
        </div>
      </div>

      {/* Dealing Animation */}
      <FirstBlackJackDealingAnimation
        players={players}
        myPlayer={myPlayer}
        isVisible={isAnimating}
        currentCard={pendingDeal?.card || null}
        targetPlayerId={pendingDeal?.playerId || null}
        onAnimationComplete={handleAnimationComplete}
      />

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
          totalSteps={gameState.deck?.length ?? 52}
          currentPlayerName={players[currentPlayerIndex]?.name}
        />
      </div>
    </div>
  );
}
