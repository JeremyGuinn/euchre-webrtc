import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import { GameHeader } from '~/components/game/GameHeader';
import { GamePhaseManager } from '~/components/game/GamePhaseManager';
import { GameTable } from '~/components/game/GameTable';
import GameContainer from '~/components/layout/GameContainer';
import { Center } from '~/components/ui/Center';
import { Spinner } from '~/components/ui/Spinner';
import { Stack } from '~/components/ui/Stack';
import { useGame } from '~/contexts/GameContext';
import type { Card as CardType } from '~/types/game';

import type { Route } from './+types/game';

// Auto-advance configuration
const AUTO_ADVANCE_CONFIG = {
  TRICK_COMPLETE_DELAY_MS: 1500,
  PROGRESS_UPDATE_INTERVAL_MS: 100,
  get PROGRESS_STEPS() {
    return this.TRICK_COMPLETE_DELAY_MS / this.PROGRESS_UPDATE_INTERVAL_MS;
  },
  get PROGRESS_INCREMENT() {
    return 100 / this.PROGRESS_STEPS;
  },
} as const;

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: `Euchre Game ${params.gameCode}` },
    { name: 'description', content: 'Playing Euchre online with friends' },
  ];
}

const suitSymbols = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
};

const suitColors = {
  spades: 'text-black',
  hearts: 'text-red-600',
  diamonds: 'text-red-600',
  clubs: 'text-black',
};

export default function Game({ params }: Route.ComponentProps) {
  const navigate = useNavigate();
  const {
    gameState,
    isHost,
    connectionStatus,
    getMyPlayer,
    getMyHand,
    isMyTurn,
    isSittingOut,
    canPlay,
    playCard,
    placeBid,
    drawDealerCard,
    proceedToDealing,
    completeDealingAnimation,
    selectDealer,
    continueTrick,
    completeHand,
    dealerDiscard,
    swapFarmersHand,
    declineFarmersHand,
    renameTeam,
    leaveGame,
    kickPlayer,
  } = useGame();
  const { gameCode } = params;

  const [autoAdvanceProgress, setAutoAdvanceProgress] = useState(0);

  const myPlayer = getMyPlayer();
  const myHand = getMyHand();
  const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayerId);

  useEffect(() => {
    // Redirect to lobby if game hasn't started
    if (gameState.phase === 'lobby') {
      navigate(`/lobby/${gameCode}`);
    }
  }, [gameState.phase, gameCode, navigate]);

  useEffect(() => {
    // Auto-advance from trick_complete phase after 3 seconds if host
    if (gameState.phase === 'trick_complete' && isHost) {
      setAutoAdvanceProgress(0);

      const progressInterval = setInterval(() => {
        setAutoAdvanceProgress(prev => {
          const newProgress = prev + AUTO_ADVANCE_CONFIG.PROGRESS_INCREMENT;
          return newProgress >= 100 ? 100 : newProgress;
        });
      }, AUTO_ADVANCE_CONFIG.PROGRESS_UPDATE_INTERVAL_MS);

      const timer = setTimeout(() => {
        continueTrick();
      }, AUTO_ADVANCE_CONFIG.TRICK_COMPLETE_DELAY_MS);

      return () => {
        clearTimeout(timer);
        clearInterval(progressInterval);
        setAutoAdvanceProgress(0);
      };
    } else {
      setAutoAdvanceProgress(0);
    }
  }, [gameState.phase, isHost, continueTrick]);

  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    const headerElement = document.getElementById('game-header');
    if (!headerElement) return;

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        setHeaderHeight(entry.target.clientHeight);
      }
    });

    resizeObserver.observe(headerElement);
    setHeaderHeight(headerElement.clientHeight);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const handleCardClick = (card: CardType) => {
    if (!isMyTurn() || gameState.phase !== 'playing') return;

    if (!canPlay(card)) {
      // Show error feedback
      return;
    }

    playCard(card);
  };

  const handleBid = (suit: CardType['suit'] | 'pass', alone: boolean = false) => {
    placeBid(suit, alone);
  };

  const handleLeaveGame = () => leaveGame();

  const shouldShowCards = () => {
    return (
      gameState.phase === 'bidding_round1' ||
      gameState.phase === 'bidding_round2' ||
      gameState.phase === 'dealer_discard' ||
      gameState.phase === 'playing' ||
      gameState.phase === 'trick_complete'
    );
  };

  if (!myPlayer) {
    return (
      <GameContainer>
        <Center className='text-white text-center'>
          <Stack spacing='4'>
            <Center>
              <Spinner size='lg' color='white' />
            </Center>
            <p>Loading game...</p>
          </Stack>
        </Center>
      </GameContainer>
    );
  }

  return (
    <GameContainer className='relative overflow-hidden'>
      {/* Header */}
      <GameHeader
        gameState={gameState}
        suitSymbols={suitSymbols}
        suitColors={suitColors}
        onLeaveGame={handleLeaveGame}
      />

      {/* Game Table */}
      {shouldShowCards() && (
        <GameTable
          gameState={gameState}
          myPlayer={myPlayer}
          myHand={myHand}
          currentPlayer={currentPlayer}
          headerHeight={headerHeight}
          shouldShowCards={shouldShowCards()}
          isSittingOut={isSittingOut}
          canPlay={canPlay}
          isMyTurn={isMyTurn}
          onCardClick={handleCardClick}
          onDealerDiscard={dealerDiscard}
          isHost={isHost}
          onKickPlayer={kickPlayer}
        />
      )}

      {/* Connection status indicator */}
      {connectionStatus !== 'connected' && (
        <div className='fixed top-20 right-4 bg-red-600 text-white px-4 py-2 rounded-lg text-sm z-50'>
          Connection: {connectionStatus}
        </div>
      )}

      {/* Game Phase Manager - handles all overlays and phase-specific UI */}
      <GamePhaseManager
        gameState={gameState}
        myPlayer={myPlayer}
        myHand={myHand}
        isHost={isHost}
        isMyTurn={isMyTurn}
        headerHeight={headerHeight}
        autoAdvanceProgress={autoAdvanceProgress}
        gameCode={gameCode}
        suitSymbols={suitSymbols}
        suitColors={suitColors}
        onBid={handleBid}
        onSelectDealer={selectDealer}
        onDrawDealerCard={drawDealerCard}
        onProceedToDealing={proceedToDealing}
        onCompleteDealingAnimation={completeDealingAnimation}
        onContinueTrick={continueTrick}
        onCompleteHand={completeHand}
        onSwapFarmersHand={swapFarmersHand}
        onDeclineFarmersHand={declineFarmersHand}
        onRenameTeam={renameTeam}
        onLeaveGame={handleLeaveGame}
      />
    </GameContainer>
  );
}
