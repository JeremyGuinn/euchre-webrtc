import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import { Card, CardBack } from '../components/game/Card';
import { DealerSelectionAnimation } from '../components/game/dealer-selection/DealerSelectionAnimation';
import { DealingAnimation } from '../components/game/DealingAnimation';
import { CurrentTurnIndicator } from '../components/game/indicators/CurrentTurnIndicator';
import { BiddingInterface } from '../components/game/interfaces/BiddingInterface';
import { FarmersHandInterface } from '../components/game/overlays/FarmersHandInterface';
import { FarmersHandWaiting } from '../components/game/overlays/FarmersHandWaiting';
import { GameCompleteOverlay } from '../components/game/overlays/GameCompleteOverlay';
import { HandCompleteOverlay } from '../components/game/overlays/HandCompleteOverlay';
import { TeamSummaryOverlay } from '../components/game/overlays/TeamSummaryOverlay';
import { TrickCompleteOverlay } from '../components/game/overlays/TrickCompleteOverlay';
import GameContainer from '../components/layout/GameContainer';
import Button from '../components/ui/Button';
import { Center } from '../components/ui/Center';
import { Spinner } from '../components/ui/Spinner';
import { Stack } from '../components/ui/Stack';
import { useGame } from '../contexts/GameContext';
import type { Card as CardType, Player } from '../types/game';
import { isDealerScrewed } from '../utils/gameState';

import type { Route } from './+types/game';

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: `Euchre Game ${params.gameId}` },
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
    disconnect,
  } = useGame();
  const { gameId } = params;

  const [hoveredDiscardCard, setHoveredDiscardCard] = useState<CardType | null>(
    null
  );

  const myPlayer = getMyPlayer();
  const myHand = getMyHand();
  const currentPlayer = gameState.players.find(
    p => p.id === gameState.currentPlayerId
  );

  useEffect(() => {
    // Redirect to lobby if game hasn't started
    if (gameState.phase === 'lobby') {
      navigate(`/lobby/${gameId}`);
    }
  }, [gameState.phase, gameId, navigate]);

  const [autoAdvanceProgress, setAutoAdvanceProgress] = useState(0);

  useEffect(() => {
    // Auto-advance from trick_complete phase after 3 seconds if host
    if (gameState.phase === 'trick_complete' && isHost) {
      setAutoAdvanceProgress(0);

      const progressInterval = setInterval(() => {
        setAutoAdvanceProgress(prev => {
          const newProgress = prev + 100 / 30; // 30 intervals over 3 seconds = 100ms each
          return newProgress >= 100 ? 100 : newProgress;
        });
      }, 100);

      const timer = setTimeout(() => {
        continueTrick();
      }, 3000);

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

  const handleBid = (
    suit: CardType['suit'] | 'pass',
    alone: boolean = false
  ) => {
    placeBid(suit, alone);
  };

  const handleLeaveGame = () => {
    disconnect();
    navigate('/');
  };

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
      <div
        className='absolute top-0 left-0 right-0 bg-black/20 p-4 z-10'
        id='game-header'
      >
        <div className='flex justify-between items-center text-white'>
          <div className='flex items-center space-x-6'>
            <h1 className='text-xl font-bold'>Euchre Game</h1>

            {gameState.trump && (
              <div className='flex items-center space-x-1'>
                <span className='text-sm'>Trump:</span>
                <span className={`text-lg ${suitColors[gameState.trump]}`}>
                  {suitSymbols[gameState.trump]}
                </span>
              </div>
            )}
          </div>
          <div className='flex items-center space-x-4'>
            <div className='text-sm'>
              {gameState.teamNames.team0}: {gameState.scores.team0} |{' '}
              {gameState.teamNames.team1}: {gameState.scores.team1}
            </div>
            <Button variant='danger' size='sm' onClick={handleLeaveGame}>
              Leave
            </Button>
          </div>
        </div>
      </div>

      {/* Game Table */}
      {shouldShowCards() && (
        <div
          className={`relative w-full`}
          style={{
            height: `calc(100vh - ${headerHeight}px)`,
            top: `${headerHeight}px`,
          }}
        >
          {/* Center area for tricks */}
          <Center className='absolute inset-0'>
            <div className='w-64 h-64 bg-green-700 rounded-full border-4 border-yellow-600 relative'>
              {/* Current trick cards */}
              {gameState.currentTrick &&
                gameState.currentTrick.cards.map(playedCard => {
                  const player = gameState.players.find(
                    p => p.id === playedCard.playerId
                  );
                  if (!player) return null;

                  // Get the relative position of the player who played this card
                  const playerPosition = getPlayerPosition(
                    player,
                    myPlayer.position
                  );

                  // Map player position to angle for card placement
                  let angle;
                  switch (playerPosition) {
                    case 'bottom':
                      angle = 180;
                      break; // 6 o'clock
                    case 'left':
                      angle = 270;
                      break; // 9 o'clock
                    case 'top':
                      angle = 0;
                      break; // 12 o'clock
                    case 'right':
                      angle = 90;
                      break; // 3 o'clock
                    default:
                      angle = 180;
                  }

                  const radius = 80;
                  const x = Math.cos(((angle - 90) * Math.PI) / 180) * radius; // -90 to adjust for 0° being top
                  const y = Math.sin(((angle - 90) * Math.PI) / 180) * radius;

                  return (
                    <div
                      key={playedCard.card.id}
                      className='absolute transform -translate-x-1/2 -translate-y-1/2 z-20'
                      style={{
                        left: `calc(50% + ${x}px)`,
                        top: `calc(50% + ${y}px)`,
                      }}
                    >
                      <Card card={playedCard.card} size='medium' />
                    </div>
                  );
                })}

              {/* Kitty card (during bidding) */}
              {(gameState.phase === 'bidding_round1' ||
                gameState.phase === 'bidding_round2') &&
                gameState.kitty && (
                  <div className='relative h-full'>
                    <div className='absolute flex items-center transform justify-self-center -translate-y-1/2 top-1/2'>
                      <div className='relative'>
                        <CardBack
                          size='medium'
                          className='absolute top-0 left-0 opacity-60'
                        />
                        <CardBack
                          size='medium'
                          className='absolute top-0.5 left-0.5 opacity-80'
                        />
                        <CardBack
                          size='medium'
                          className='absolute top-1 left-1'
                        />

                        {(gameState.phase === 'bidding_round1' && (
                          <div className='flex justify-center' id='kitty-card'>
                            <Card
                              card={gameState.kitty}
                              size='medium'
                              className='relative z-10'
                            />
                          </div>
                        )) || (
                          <CardBack size='medium' className='relative z-10' />
                        )}
                      </div>
                    </div>
                  </div>
                )}
            </div>
          </Center>

          {/* Players around the table */}
          {gameState.players.map(player => {
            const position = getPlayerPosition(player, myPlayer.position);
            const isCurrentPlayer = player.id === gameState.currentPlayerId;

            // Check if this player is sitting out due to going alone
            const isPlayerSittingOut =
              gameState.maker?.alone &&
              gameState.maker.playerId !== player.id &&
              gameState.players.find(p => p.id === gameState.maker!.playerId)
                ?.teamId === player.teamId;

            return (
              <div key={player.id} className={getPositionClasses(position)}>
                <div
                  className={`text-center flex gap-2 items-center ${position === 'top' ? 'flex-col-reverse ' : 'flex-col'}`}
                >
                  {gameState.phase !== 'dealing_animation' &&
                    gameState.phase !== 'dealer_selection' && (
                      <div
                        className={`inline-block px-3 py-1 rounded-lg text-sm font-medium w-fit ${
                          isPlayerSittingOut
                            ? 'bg-gray-500 text-gray-300'
                            : isCurrentPlayer
                              ? 'bg-yellow-400 text-black'
                              : 'bg-white/20 text-white'
                        }${!player.isConnected ? 'opacity-50' : ''}
                  `}
                      >
                        {player.name} {player.id === myPlayer.id && '(You)'}
                        {!player.isConnected && ' (Disconnected)'}
                        {gameState.currentDealerId === player.id && ' (Dealer)'}
                        {isPlayerSittingOut && ' (Sitting Out)'}
                      </div>
                    )}

                  {/* Player's cards (face down for others, face up for self) */}
                  <div className='flex space-x-1'>
                    {player.id === myPlayer.id
                      ? // My hand - show actual cards
                        myHand.map(card => {
                          const isInDealerDiscardPhase =
                            gameState.phase === 'dealer_discard' &&
                            myPlayer.id === gameState.currentDealerId;
                          const isKittyCard =
                            isInDealerDiscardPhase &&
                            gameState.kitty &&
                            card.id === gameState.kitty.id;
                          const canDiscard =
                            isInDealerDiscardPhase && !isKittyCard;
                          const isHovered =
                            isInDealerDiscardPhase &&
                            hoveredDiscardCard?.id === card.id;

                          return (
                            <div
                              key={card.id}
                              className='relative'
                              role='presentation'
                              onMouseEnter={() =>
                                isInDealerDiscardPhase &&
                                canDiscard &&
                                setHoveredDiscardCard(card)
                              }
                              onMouseLeave={() =>
                                isInDealerDiscardPhase &&
                                setHoveredDiscardCard(null)
                              }
                            >
                              <Card
                                card={card}
                                onClick={() => {
                                  if (isInDealerDiscardPhase && canDiscard) {
                                    dealerDiscard(card);
                                  } else if (!isInDealerDiscardPhase) {
                                    handleCardClick(card);
                                  }
                                }}
                                disabled={
                                  isSittingOut() ||
                                  (isInDealerDiscardPhase
                                    ? !canDiscard
                                    : !isMyTurn() ||
                                      gameState.phase !== 'playing' ||
                                      !canPlay(card))
                                }
                                className={`
                                ${
                                  isSittingOut()
                                    ? 'opacity-30 grayscale'
                                    : !canPlay(card) &&
                                        isMyTurn() &&
                                        gameState.phase === 'playing'
                                      ? 'opacity-50'
                                      : ''
                                }
                                ${
                                  isInDealerDiscardPhase && canDiscard
                                    ? 'cursor-pointer hover:scale-105 hover:-translate-y-1'
                                    : ''
                                }
                                ${
                                  isInDealerDiscardPhase && !canDiscard
                                    ? 'opacity-60'
                                    : ''
                                }
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
                              {isSittingOut() && (
                                <div className='absolute inset-0 bg-gray-900/40 rounded-lg flex items-center justify-center pointer-events-none'>
                                  <div className='bg-gray-700 text-white text-xs font-bold px-2 py-1 rounded shadow-lg'>
                                    SITTING OUT
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                      : // Other players - show card backs only after cards are dealt
                        (() => {
                          // Only show cards after dealing phase is complete
                          if (!shouldShowCards()) {
                            return null;
                          }

                          // Calculate how many cards this player has left
                          let cardsRemaining = 5; // Start with 5 cards per hand

                          // Count cards played in completed tricks
                          if (gameState.completedTricks) {
                            const cardsPlayedInCompletedTricks =
                              gameState.completedTricks
                                .flatMap(trick => trick.cards)
                                .filter(
                                  playedCard =>
                                    playedCard.playerId === player.id
                                ).length;
                            cardsRemaining -= cardsPlayedInCompletedTricks;
                          }

                          // Count cards played in current trick
                          if (gameState.currentTrick) {
                            const cardsPlayedInCurrentTrick =
                              gameState.currentTrick.cards.filter(
                                playedCard => playedCard.playerId === player.id
                              ).length;
                            cardsRemaining -= cardsPlayedInCurrentTrick;
                          }

                          // Ensure we don't show negative cards
                          cardsRemaining = Math.max(0, cardsRemaining);

                          return Array.from({ length: cardsRemaining }).map(
                            (_, index) => <CardBack key={index} size='small' />
                          );
                        })()}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Current turn indicator */}
          <CurrentTurnIndicator
            gameState={gameState}
            myPlayer={myPlayer}
            currentPlayer={currentPlayer}
          />

          {/* Bidding Interface - positioned below player's hand */}
          {((gameState.phase === 'bidding_round1' && gameState.kitty) ||
            gameState.phase === 'bidding_round2') &&
            isMyTurn() && (
              <BiddingInterface
                phase={gameState.phase as 'bidding_round1' | 'bidding_round2'}
                kitty={gameState.kitty}
                isDealer={gameState.currentDealerId === myPlayer.id}
                turnedDownSuit={gameState.turnedDownSuit}
                suitSymbols={suitSymbols}
                suitColors={suitColors}
                _screwTheDealer={gameState.options.screwTheDealer}
                isDealerScrewed={isDealerScrewed(gameState)}
                onBid={handleBid}
              />
            )}
        </div>
      )}

      {/* Dealer Selection Animation */}
      {gameState.phase === 'dealer_selection' && (
        <>
          {!gameState.dealerSelectionCards &&
          !gameState.firstBlackJackDealing ? (
            // Initial state - show instruction overlay
            <Center className='absolute inset-0 bg-black/60 z-40'>
              <div className='text-white text-center p-8 bg-black/40 rounded-lg backdrop-blur-sm border border-white/20'>
                <h2 className='text-3xl font-bold mb-4'>
                  {gameState.options.dealerSelection === 'random_cards' &&
                  gameState.options.teamSelection === 'random_cards'
                    ? 'Dealer and Team Selection'
                    : 'Dealer Selection'}
                </h2>
                <p className='text-lg mb-4'>
                  {gameState.options.dealerSelection === 'random_cards' &&
                    gameState.options.teamSelection === 'predetermined' &&
                    'Each player will draw a card to determine the dealer.'}
                  {gameState.options.dealerSelection === 'random_cards' &&
                    gameState.options.teamSelection === 'random_cards' &&
                    'Each player will draw a card to determine the dealer and teams.'}
                  {gameState.options.dealerSelection === 'first_black_jack' &&
                    gameState.options.teamSelection === 'predetermined' &&
                    'The player with the first Black Jack will be the dealer.'}
                  {gameState.options.dealerSelection === 'first_black_jack' &&
                    gameState.options.teamSelection === 'random_cards' &&
                    'The player with the first Black Jack will be the dealer, and the two players with the lowest cards will form one team.'}
                  {gameState.options.dealerSelection ===
                    'predetermined_first_dealer' &&
                    'The predetermined dealer has been selected and the game will continue.'}
                </p>
                {gameState.options.teamSelection === 'random_cards' &&
                  gameState.options.dealerSelection === 'random_cards' && (
                    <p className='text-sm text-gray-300 mb-6'>
                      The two players with the lowest cards will form one team.
                      <br />
                      The player with the lowest card will be the dealer.
                    </p>
                  )}

                {isHost ? (
                  <Button onClick={selectDealer} size='lg'>
                    {gameState.options.dealerSelection === 'random_cards'
                      ? 'Start Card Drawing'
                      : gameState.options.dealerSelection === 'first_black_jack'
                        ? 'Find First Black Jack'
                        : 'Continue Game'}
                  </Button>
                ) : (
                  <div className='text-gray-400'>
                    Waiting for host to start...
                  </div>
                )}
              </div>
            </Center>
          ) : (
            <div
              className='relative w-full'
              style={{
                height: `calc(100vh - ${headerHeight}px)`,
                top: `${headerHeight}px`,
              }}
            >
              <DealerSelectionAnimation
                players={gameState.players}
                myPlayer={myPlayer}
                isVisible={true}
                deck={gameState.deck}
                method={gameState.options.dealerSelection}
                dealerSelectionCards={gameState.dealerSelectionCards}
                onCardPicked={drawDealerCard}
              />
            </div>
          )}
        </>
      )}

      {/* Connection status indicator */}
      {connectionStatus !== 'connected' && (
        <div className='fixed top-20 right-4 bg-red-600 text-white px-4 py-2 rounded-lg text-sm z-50'>
          Connection: {connectionStatus}
        </div>
      )}

      {/* Team Summary - Show dealer and team assignments */}
      {gameState.phase === 'team_summary' && (
        <TeamSummaryOverlay
          gameState={gameState}
          suitSymbols={suitSymbols}
          suitColors={suitColors}
          myPlayer={myPlayer}
          isHost={isHost}
          onRenameTeam={renameTeam}
          onProceedToDealing={proceedToDealing}
        />
      )}

      {/* Dealing Animation */}
      {gameState.phase === 'dealing_animation' && (
        <div
          className='relative w-full'
          style={{
            height: `calc(100vh - ${headerHeight}px)`,
            top: `${headerHeight}px`,
          }}
        >
          <DealingAnimation
            players={gameState.players}
            myPlayer={myPlayer}
            isVisible={true}
            onComplete={completeDealingAnimation}
          />
        </div>
      )}

      {/* Trick Complete - Show winner and continue */}
      <TrickCompleteOverlay
        gameState={gameState}
        myPlayer={myPlayer}
        isHost={isHost}
        autoAdvanceProgress={autoAdvanceProgress}
        suitSymbols={suitSymbols}
        suitColors={suitColors}
        onContinueTrick={continueTrick}
      />

      {/* Hand Complete - Show hand results */}
      <HandCompleteOverlay
        gameState={gameState}
        myPlayer={myPlayer}
        isHost={isHost}
        suitSymbols={suitSymbols}
        suitColors={suitColors}
        onCompleteHand={completeHand}
      />

      {/* Farmer's Hand Interface - Allow player to swap cards */}
      {gameState.phase === 'farmers_hand_swap' && (
        <>
          {gameState.farmersHandPlayer === myPlayer.id ? (
            <FarmersHandInterface
              hand={myHand}
              onSwap={swapFarmersHand}
              onDecline={declineFarmersHand}
            />
          ) : (
            gameState.farmersHandPlayer && (
              <FarmersHandWaiting
                farmersHandPlayer={
                  gameState.players.find(
                    p => p.id === gameState.farmersHandPlayer
                  )!
                }
              />
            )
          )}
        </>
      )}

      {/* Game Complete - Show final results */}
      <GameCompleteOverlay
        gameState={gameState}
        myPlayer={myPlayer}
        isHost={isHost}
        gameId={gameId}
        onLeaveGame={handleLeaveGame}
      />
    </GameContainer>
  );
}
