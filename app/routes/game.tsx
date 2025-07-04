import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import { EditableTeamName } from '../components/forms/EditableTeamName';
import { Card, CardBack } from '../components/game/Card';
import { DealerSelectionAnimation } from '../components/game/dealer-selection/DealerSelectionAnimation';
import { DealingAnimation } from '../components/game/DealingAnimation';
import GameContainer from '../components/layout/GameContainer';
import Button from '../components/ui/Button';
import { useGame } from '../contexts/GameContext';
import type { Card as CardType, Player } from '../types/game';

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
    canPlay,
    playCard,
    placeBid,
    drawDealerCard,
    completeDealerSelection,
    proceedToDealing,
    completeDealingAnimation,
    selectDealer,
    continueTrick,
    completeHand,
    dealerDiscard,
    renameTeam,
    disconnect,
  } = useGame();
  const { gameId } = params;

  const [selectedCard] = useState<CardType | null>(null);
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

  const [kittyWidth, setKittyWidth] = useState(0);

  useEffect(() => {
    if (
      !(
        (gameState.phase === 'bidding_round1' ||
          gameState.phase === 'bidding_round2') &&
        gameState.kitty
      )
    ) {
      return;
    }
    const kittyElement = document.getElementById('kitty-card');
    if (!kittyElement) return;

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        setKittyWidth(entry.target.clientWidth);
      }
    });

    resizeObserver.observe(kittyElement);
    setKittyWidth(kittyElement.clientWidth);

    return () => {
      resizeObserver.disconnect();
    };
  }, [gameState.phase, gameState.kitty]);

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
      <GameContainer className='flex items-center justify-center'>
        <div className='text-white text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4'></div>
          <p>Loading game...</p>
        </div>
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
      <div
        className={`relative w-full`}
        style={{
          height: `calc(100vh - ${headerHeight}px)`,
          top: `${headerHeight}px`,
        }}
      >
        {/* Center area for tricks */}
        {(gameState.phase === 'playing' ||
          gameState.phase === 'bidding_round1' ||
          gameState.phase === 'bidding_round2') && (
          <div className='absolute inset-0 flex items-center justify-center'>
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
                    {isMyTurn() && gameState.phase === 'bidding_round1' && (
                      <Button
                        variant='primary'
                        size='sm'
                        onClick={() => handleBid(gameState.kitty!.suit)}
                        className='absolute px-3 py-1 text-xs h-min w-min top-1/2 transform -translate-y-1/2 -translate-x-1/2'
                        style={{
                          left: `calc(50% - ${kittyWidth}px)`,
                        }}
                      >
                        {myPlayer.id === gameState.currentDealerId
                          ? 'Take it up'
                          : myPlayer.teamId ===
                              gameState.players.find(
                                p => p.id === gameState.currentDealerId
                              )?.teamId
                            ? 'Assist'
                            : 'Order it up'}
                      </Button>
                    )}
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

                    {isMyTurn() && gameState.phase === 'bidding_round1' && (
                      <Button
                        variant='secondary'
                        size='sm'
                        onClick={() => handleBid('pass')}
                        className='absolute px-3 py-1 text-xs h-min w-fit top-1/2 transform -translate-y-1/2 -translate-x-1/2'
                        style={{
                          left: `calc(50% + ${kittyWidth}px)`,
                        }}
                      >
                        Pass
                      </Button>
                    )}
                  </div>
                )}
            </div>
          </div>
        )}

        {/* Players around the table */}
        {gameState.players.map(player => {
          const position = getPlayerPosition(player, myPlayer.position);
          const isCurrentPlayer = player.id === gameState.currentPlayerId;

          return (
            <div key={player.id} className={getPositionClasses(position)}>
              <div
                className={`text-center flex gap-2 items-center ${position === 'top' ? 'flex-col-reverse ' : 'flex-col'}`}
              >
                {gameState.phase !== 'dealing_animation' &&
                  gameState.phase !== 'dealer_selection' && (
                    <div
                      className={`inline-block px-3 py-1 rounded-lg text-sm font-medium w-fit ${isCurrentPlayer ? 'bg-yellow-400 text-black' : 'bg-white/20 text-white'}${!player.isConnected ? 'opacity-50' : ''}
                  `}
                    >
                      {player.name} {player.id === myPlayer.id && '(You)'}
                      {!player.isConnected && ' (Disconnected)'}
                      {gameState.currentDealerId === player.id && ' (Dealer)'}
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
                                isInDealerDiscardPhase
                                  ? !canDiscard
                                  : !isMyTurn() ||
                                    gameState.phase !== 'playing' ||
                                    !canPlay(card)
                              }
                              className={`
                                ${
                                  selectedCard?.id === card.id
                                    ? 'ring-2 ring-yellow-400'
                                    : ''
                                }
                                ${
                                  !canPlay(card) &&
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
                                playedCard => playedCard.playerId === player.id
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
        {currentPlayer && gameState.phase !== 'dealing_animation' && (
          <div className='absolute top-4 left-1/2 transform -translate-x-1/2 text-white text-center z-20'>
            <div className='bg-black/70 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg border border-white/20'>
              {currentPlayer.id === myPlayer.id ? (
                <>
                  {gameState.phase === 'dealer_discard' && (
                    <>
                      <span className='font-medium text-yellow-400'>
                        {/* If they were ordered up add text */}
                        {gameState.maker?.playerId !== myPlayer.id
                          ? 'You were ordered up!'
                          : 'You took it up!'}
                      </span>
                      <br />
                    </>
                  )}
                  <span className='font-medium text-yellow-400'>
                    {gameState.phase === 'dealer_discard'
                      ? `Choose a card to discard.`
                      : 'Your turn!'}
                  </span>
                </>
              ) : (
                <span>
                  {gameState.phase === 'dealer_discard'
                    ? `Waiting for ${currentPlayer.name} to discard...`
                    : `Waiting for ${currentPlayer.name}...`}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Bidding Interface - positioned below player's hand */}
        {gameState.phase === 'bidding_round2' && isMyTurn() && (
          <div className='absolute bottom-24 left-1/2 transform -translate-x-1/2 z-30'>
            <div className='bg-white/95 backdrop-blur-sm rounded-lg shadow-xl p-3 border border-gray-200 max-w-xs'>
              <div className='text-center'>
                <h3 className='text-sm font-bold text-gray-800 mb-2'>
                  Call Trump
                </h3>

                {gameState.turnedDownSuit && (
                  <div className='mb-2'>
                    <p className='text-xs text-gray-600'>
                      Turned down:{' '}
                      <span
                        className={`font-medium ${suitColors[gameState.turnedDownSuit]}`}
                      >
                        {suitSymbols[gameState.turnedDownSuit]}{' '}
                        {gameState.turnedDownSuit}
                      </span>
                    </p>
                  </div>
                )}

                <div className='grid grid-cols-2 gap-1 mb-2'>
                  {(['spades', 'hearts', 'diamonds', 'clubs'] as const)
                    .filter(suit => suit !== gameState.turnedDownSuit)
                    .map(suit => (
                      <Button
                        key={suit}
                        variant='ghost'
                        size='sm'
                        onClick={() => handleBid(suit)}
                        className='flex items-center justify-center space-x-1 px-2 py-1 text-xs'
                      >
                        <span className={`text-sm ${suitColors[suit]}`}>
                          {suitSymbols[suit]}
                        </span>
                        <span className='text-xs capitalize'>{suit}</span>
                      </Button>
                    ))}
                </div>

                <Button
                  variant='secondary'
                  size='sm'
                  onClick={() => handleBid('pass')}
                  className='px-3 py-1 text-xs'
                >
                  Pass
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dealer Selection Animation */}
      {gameState.phase === 'dealer_selection' && (
        <>
          {!gameState.dealerSelectionCards ? (
            // Initial state - show instruction overlay
            <div className='absolute inset-0 bg-black/60 z-40 flex items-center justify-center'>
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
                      : 'Find First Black Jack'}
                  </Button>
                ) : (
                  <div className='text-gray-400'>
                    Waiting for host to start...
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div
              className='absolute w-full'
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
                onComplete={completeDealerSelection}
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
        <div className='absolute inset-0 bg-black/40 z-40'>
          <div className='flex flex-col items-center justify-center h-full px-8 py-4'>
            <div className='bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-8 max-w-2xl w-full mx-4 max-h-[99vh] overflow-y-auto'>
              <div className='text-center mb-8'>
                <h2 className='text-3xl font-bold text-gray-800 mb-2'>
                  Team Assignments
                </h2>
                <p className='text-gray-600'>
                  Here are the teams and dealer for this hand
                </p>
              </div>

              {/* Dealer Information */}
              <div className='text-center mb-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200'>
                {(() => {
                  const dealer = gameState.players.find(
                    p => p.id === gameState.currentDealerId
                  );
                  return (
                    <div>
                      <h3 className='text-lg font-semibold text-yellow-800 mb-1'>
                        Dealer
                      </h3>
                      <p className='text-xl font-bold text-yellow-900'>
                        {dealer?.name || 'Unknown'}
                        {dealer?.id === myPlayer.id && ' (You)'}
                      </p>
                      <p className='text-sm text-yellow-700 mt-1'>
                        The dealer will deal the cards and has the final bidding
                        option
                      </p>
                    </div>
                  );
                })()}
              </div>

              {/* Teams Grid */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-8'>
                {/* Team 1 */}
                <div className='bg-blue-50 rounded-lg p-4 border border-blue-200'>
                  <div className='text-lg text-blue-800 mb-3 text-center'>
                    <EditableTeamName
                      teamId={0}
                      teamName={gameState.teamNames.team0}
                      onRename={renameTeam}
                      disabled={
                        !isHost &&
                        gameState.players.find(p => p.id === myPlayer.id)
                          ?.teamId !== 0
                      }
                      className='text-blue-800'
                    />
                  </div>
                  <div className='space-y-2'>
                    {gameState.players
                      .filter(p => p.teamId === 0)
                      .sort((a, b) => a.position - b.position)
                      .map(player => (
                        <div
                          key={player.id}
                          className={`
                            p-2 rounded-md text-center font-medium
                            ${player.id === myPlayer.id ? 'bg-blue-200 text-blue-900' : 'bg-white text-blue-800'}
                            ${player.id === gameState.currentDealerId ? 'ring-2 ring-yellow-400' : ''}
                          `}
                        >
                          {player.name}
                          {player.id === myPlayer.id && ' (You)'}
                          {player.id === gameState.currentDealerId && ' 🃏'}
                        </div>
                      ))}
                  </div>
                </div>

                {/* Team 2 */}
                <div className='bg-red-50 rounded-lg p-4 border border-red-200'>
                  <div className='text-lg text-red-800 mb-3 text-center'>
                    <EditableTeamName
                      teamId={1}
                      teamName={gameState.teamNames.team1}
                      onRename={renameTeam}
                      disabled={
                        !isHost &&
                        gameState.players.find(p => p.id === myPlayer.id)
                          ?.teamId !== 1
                      }
                      className='text-red-800'
                    />
                  </div>
                  <div className='space-y-2'>
                    {gameState.players
                      .filter(p => p.teamId === 1)
                      .sort((a, b) => a.position - b.position)
                      .map(player => (
                        <div
                          key={player.id}
                          className={`
                            p-2 rounded-md text-center font-medium
                            ${player.id === myPlayer.id ? 'bg-red-200 text-red-900' : 'bg-white text-red-800'}
                            ${player.id === gameState.currentDealerId ? 'ring-2 ring-yellow-400' : ''}
                          `}
                        >
                          {player.name}
                          {player.id === myPlayer.id && ' (You)'}
                          {player.id === gameState.currentDealerId && ' 🃏'}
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* Team assignment explanation */}
              {gameState.options.teamSelection === 'random_cards' && (
                <div className='text-center mb-6 p-3 bg-gray-50 rounded-lg'>
                  {' '}
                  <p className='text-sm text-gray-600'>
                    <span className='font-medium'>Random Teams:</span> Teams
                    were determined by the cards drawn. The two players with the
                    lowest cards form one team.
                  </p>
                </div>
              )}

              {gameState.options.teamSelection === 'predetermined' && (
                <div className='text-center mb-6 p-3 bg-gray-50 rounded-lg'>
                  <p className='text-sm text-gray-600'>
                    <span className='font-medium'>Predetermined Teams:</span>{' '}
                    Teams are set by seating position. Players sitting across
                    from each other are teammates.
                  </p>
                </div>
              )}

              {/* Continue Button */}
              <div className='text-center'>
                {isHost ? (
                  <Button onClick={proceedToDealing} size='lg' className='px-8'>
                    Deal Cards and Start Hand
                  </Button>
                ) : (
                  <div className='text-gray-600'>
                    <div className='inline-flex items-center space-x-2'>
                      <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600'></div>
                      <span>Waiting for host to deal cards...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dealing Animation */}
      {gameState.phase === 'dealing_animation' && (
        <DealingAnimation
          players={gameState.players}
          myPlayer={myPlayer}
          isVisible={true}
          onComplete={completeDealingAnimation}
        />
      )}

      {/* Trick Complete - Show winner and continue */}
      {gameState.phase === 'trick_complete' && (
        <div className='absolute inset-0 bg-black/40 z-40'>
          <div className='flex flex-col items-center justify-center h-full p-8'>
            <div className='bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-8 max-w-md w-full mx-4'>
              <div className='text-center'>
                <h2 className='text-2xl font-bold text-gray-800 mb-4'>
                  Trick Complete!
                </h2>

                {(() => {
                  const lastTrick =
                    gameState.completedTricks[
                      gameState.completedTricks.length - 1
                    ];
                  const winner = lastTrick
                    ? gameState.players.find(p => p.id === lastTrick.winnerId)
                    : null;
                  const winningCard = lastTrick?.cards.find(
                    playedCard => playedCard.playerId === lastTrick.winnerId
                  );

                  return (
                    <div className='mb-6'>
                      {winner && winningCard && (
                        <>
                          <p className='text-lg text-gray-700 mb-3'>
                            <span className='font-semibold text-blue-600'>
                              {winner.name}
                            </span>
                            {winner.id === myPlayer.id && ' (You)'} won the
                            trick!
                          </p>

                          <div className='flex justify-center mb-4'>
                            <Card card={winningCard.card} size='medium' />
                          </div>

                          <p className='text-sm text-gray-600 mb-2'>
                            Winning card:{' '}
                            <span
                              className={`font-medium ${suitColors[winningCard.card.suit]}`}
                            >
                              {suitSymbols[winningCard.card.suit]}{' '}
                              {winningCard.card.value}
                            </span>
                          </p>

                          <div className='text-xs text-gray-500'>
                            Tricks completed: {gameState.completedTricks.length}{' '}
                            / 5
                          </div>
                        </>
                      )}
                    </div>
                  );
                })()}

                {isHost ? (
                  <div className='relative'>
                    <Button
                      onClick={continueTrick}
                      size='lg'
                      className='w-full relative overflow-hidden'
                    >
                      {/* Progress background */}
                      <div
                        className='absolute inset-0 bg-white/20 transition-all duration-100 ease-linear'
                        style={{
                          width: `${autoAdvanceProgress}%`,
                          transformOrigin: 'left',
                        }}
                      />

                      {/* Button text */}
                      <span className='relative z-10'>
                        Continue to Next Trick
                        {autoAdvanceProgress > 0 && (
                          <span className='ml-2 text-sm opacity-80'>
                            (
                            {Math.ceil(((100 - autoAdvanceProgress) / 100) * 3)}
                            s)
                          </span>
                        )}
                      </span>
                    </Button>
                  </div>
                ) : (
                  <div className='text-gray-600'>
                    <div className='inline-flex items-center space-x-2'>
                      <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600'></div>
                      <span>Waiting for host to continue...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hand Complete - Show hand results */}
      {gameState.phase === 'hand_complete' && (
        <div className='absolute inset-0 bg-black/40 z-40'>
          <div className='flex flex-col items-center justify-center h-full p-8'>
            <div className='bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-8 max-w-lg w-full mx-4 overflow-y-auto'>
              <div className='text-center'>
                <h2 className='text-3xl font-bold text-gray-800 mb-6'>
                  Hand Complete!
                </h2>

                {(() => {
                  const maker = gameState.maker;
                  const makerPlayer = maker
                    ? gameState.players.find(p => p.id === maker.playerId)
                    : null;
                  const makerTeam = maker?.teamId;
                  const handScores = gameState.handScores;

                  // Count tricks won by each team
                  const team0Tricks = gameState.completedTricks.filter(
                    trick => {
                      const winner = gameState.players.find(
                        p => p.id === trick.winnerId
                      );
                      return winner?.teamId === 0;
                    }
                  ).length;

                  const team1Tricks = gameState.completedTricks.filter(
                    trick => {
                      const winner = gameState.players.find(
                        p => p.id === trick.winnerId
                      );
                      return winner?.teamId === 1;
                    }
                  ).length;

                  const makerTeamTricks =
                    makerTeam === 0 ? team0Tricks : team1Tricks;
                  const madeBid = makerTeamTricks >= 3;

                  return (
                    <div className='mb-6'>
                      {/* Trump and Maker Info */}
                      <div className='mb-6 p-4 bg-gray-50 rounded-lg'>
                        <div className='flex items-center justify-center space-x-4 mb-2'>
                          <span className='text-sm text-gray-600'>Trump:</span>
                          {gameState.trump && (
                            <span
                              className={`text-xl ${suitColors[gameState.trump]}`}
                            >
                              {suitSymbols[gameState.trump]} {gameState.trump}
                            </span>
                          )}
                        </div>
                        {makerPlayer && (
                          <p className='text-sm text-gray-700'>
                            <span className='font-medium'>
                              {makerPlayer.name}
                            </span>
                            {makerPlayer.id === myPlayer.id && ' (You)'} called
                            trump
                            {maker?.alone && ' and went alone'}
                          </p>
                        )}
                      </div>

                      {/* Tricks Won */}
                      <div className='grid grid-cols-2 gap-4 mb-6'>
                        <div
                          className={`p-4 rounded-lg ${makerTeam === 0 ? 'bg-blue-100 border-2 border-blue-300' : 'bg-gray-100'}`}
                        >
                          <h3 className='font-semibold text-gray-800 mb-1'>
                            {gameState.teamNames.team0}
                          </h3>
                          <div className='text-2xl font-bold text-blue-600'>
                            {team0Tricks}
                          </div>
                          <div className='text-xs text-gray-600'>
                            tricks won
                          </div>
                        </div>
                        <div
                          className={`p-4 rounded-lg ${makerTeam === 1 ? 'bg-red-100 border-2 border-red-300' : 'bg-gray-100'}`}
                        >
                          <h3 className='font-semibold text-gray-800 mb-1'>
                            {gameState.teamNames.team1}
                          </h3>
                          <div className='text-2xl font-bold text-red-600'>
                            {team1Tricks}
                          </div>
                          <div className='text-xs text-gray-600'>
                            tricks won
                          </div>
                        </div>
                      </div>

                      {/* Hand Result */}
                      <div className='mb-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200'>
                        {madeBid ? (
                          <div>
                            <p className='text-lg font-semibold text-green-700 mb-2'>
                              {makerTeamTricks === 5 ? 'Sweep!' : 'Bid Made!'}
                            </p>
                            <p className='text-sm text-gray-700'>
                              {gameState.teamNames[
                                `team${makerTeam!}` as 'team0' | 'team1'
                              ] || `Team ${makerTeam! + 1}`}{' '}
                              made their bid with {makerTeamTricks} trick
                              {makerTeamTricks !== 1 ? 's' : ''}
                              {makerTeamTricks === 5 &&
                                maker?.alone &&
                                ' (going alone)'}
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p className='text-lg font-semibold text-red-700 mb-2'>
                              Bid Failed!
                            </p>
                            <p className='text-sm text-gray-700'>
                              {gameState.teamNames[
                                `team${makerTeam!}` as 'team0' | 'team1'
                              ] || `Team ${makerTeam! + 1}`}{' '}
                              only won {makerTeamTricks} trick
                              {makerTeamTricks !== 1 ? 's' : ''} - other team
                              gets 2 points
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Points Awarded */}
                      <div className='grid grid-cols-2 gap-4 mb-6'>
                        <div className='text-center'>
                          <div
                            className={`text-3xl font-bold ${handScores.team0 > 0 ? 'text-green-600' : 'text-gray-400'}`}
                          >
                            +{handScores.team0}
                          </div>
                          <div className='text-sm text-gray-600'>
                            {gameState.teamNames.team0} Points
                          </div>
                        </div>
                        <div className='text-center'>
                          <div
                            className={`text-3xl font-bold ${handScores.team1 > 0 ? 'text-green-600' : 'text-gray-400'}`}
                          >
                            +{handScores.team1}
                          </div>
                          <div className='text-sm text-gray-600'>
                            {gameState.teamNames.team1} Points
                          </div>
                        </div>
                      </div>

                      {/* Total Scores */}
                      <div className='grid grid-cols-2 gap-4 mb-6'>
                        <div className='text-center p-3 bg-blue-50 rounded-lg'>
                          <div className='text-2xl font-bold text-blue-600'>
                            {gameState.scores.team0}
                          </div>
                          <div className='text-sm text-gray-600'>
                            {gameState.teamNames.team0} Total
                          </div>
                        </div>
                        <div className='text-center p-3 bg-red-50 rounded-lg'>
                          <div className='text-2xl font-bold text-red-600'>
                            {gameState.scores.team1}
                          </div>
                          <div className='text-sm text-gray-600'>
                            {gameState.teamNames.team1} Total
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {isHost ? (
                  <Button onClick={completeHand} size='lg' className='w-full'>
                    {gameState.scores.team0 >= 10 ||
                    gameState.scores.team1 >= 10
                      ? 'End Game'
                      : 'Start Next Hand'}
                  </Button>
                ) : (
                  <div className='text-gray-600'>
                    <div className='inline-flex items-center space-x-2'>
                      <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600'></div>
                      <span>Waiting for host...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Game Complete - Show final results */}
      {gameState.phase === 'game_complete' && (
        <div className='absolute inset-0 bg-black/40 z-40'>
          <div className='flex flex-col items-center justify-center h-full p-8'>
            <div className='bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-8 max-w-lg w-full mx-4 overflow-y-auto'>
              <div className='text-center'>
                <h2 className='text-4xl font-bold text-gray-800 mb-6'>
                  🎉 Game Complete! 🎉
                </h2>

                {(() => {
                  const team0Won = gameState.scores.team0 >= 10;
                  const team1Won = gameState.scores.team1 >= 10;
                  const winningTeam = team0Won ? 0 : 1;
                  const myTeam = myPlayer.teamId;
                  const iWon = myTeam === winningTeam;

                  return (
                    <div className='mb-8'>
                      {/* Winner Announcement */}
                      <div
                        className={`mb-6 p-6 rounded-lg ${iWon ? 'bg-green-100 border-green-300' : 'bg-gray-100 border-gray-300'} border-2`}
                      >
                        <h3
                          className={`text-2xl font-bold mb-2 ${iWon ? 'text-green-800' : 'text-gray-800'}`}
                        >
                          {iWon
                            ? 'You Won!'
                            : `${gameState.teamNames[`team${winningTeam}` as 'team0' | 'team1'] || `Team ${winningTeam + 1}`} Wins!`}
                        </h3>
                        <div className='space-y-1'>
                          {gameState.players
                            .filter(p => p.teamId === winningTeam)
                            .map(player => (
                              <p
                                key={player.id}
                                className={`text-lg ${iWon ? 'text-green-700' : 'text-gray-700'}`}
                              >
                                🏆 {player.name}
                                {player.id === myPlayer.id && ' (You)'}
                              </p>
                            ))}
                        </div>
                      </div>

                      {/* Final Scores */}
                      <div className='grid grid-cols-2 gap-6 mb-6'>
                        <div
                          className={`text-center p-6 rounded-lg ${team0Won ? 'bg-yellow-100 border-yellow-400 border-2' : 'bg-blue-50'}`}
                        >
                          <h3 className='text-lg font-semibold text-gray-800 mb-2'>
                            {gameState.teamNames.team0}
                          </h3>
                          <div
                            className={`text-4xl font-bold ${team0Won ? 'text-yellow-600' : 'text-blue-600'}`}
                          >
                            {gameState.scores.team0}
                          </div>
                          {team0Won && (
                            <div className='text-sm text-yellow-700 mt-1'>
                              🏆 Winners!
                            </div>
                          )}
                          <div className='mt-2 space-y-1'>
                            {gameState.players
                              .filter(p => p.teamId === 0)
                              .map(player => (
                                <div
                                  key={player.id}
                                  className='text-sm text-gray-600'
                                >
                                  {player.name}
                                  {player.id === myPlayer.id && ' (You)'}
                                </div>
                              ))}
                          </div>
                        </div>

                        <div
                          className={`text-center p-6 rounded-lg ${team1Won ? 'bg-yellow-100 border-yellow-400 border-2' : 'bg-red-50'}`}
                        >
                          <h3 className='text-lg font-semibold text-gray-800 mb-2'>
                            {gameState.teamNames.team1}
                          </h3>
                          <div
                            className={`text-4xl font-bold ${team1Won ? 'text-yellow-600' : 'text-red-600'}`}
                          >
                            {gameState.scores.team1}
                          </div>
                          {team1Won && (
                            <div className='text-sm text-yellow-700 mt-1'>
                              🏆 Winners!
                            </div>
                          )}
                          <div className='mt-2 space-y-1'>
                            {gameState.players
                              .filter(p => p.teamId === 1)
                              .map(player => (
                                <div
                                  key={player.id}
                                  className='text-sm text-gray-600'
                                >
                                  {player.name}
                                  {player.id === myPlayer.id && ' (You)'}
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>

                      {/* Game Stats */}
                      <div className='mb-6 p-4 bg-gray-50 rounded-lg'>
                        <h4 className='font-semibold text-gray-800 mb-2'>
                          Game Summary
                        </h4>
                        <div className='text-sm text-gray-600 space-y-1'>
                          <p>
                            Final Score: {gameState.scores.team0} -{' '}
                            {gameState.scores.team1}
                          </p>
                          <p>Game ID: {gameState.gameCode || gameState.id}</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Action Buttons */}
                <div className='space-y-3'>
                  <Button
                    onClick={handleLeaveGame}
                    size='lg'
                    className='w-full'
                  >
                    Return to Home
                  </Button>
                  {isHost && (
                    <Button
                      variant='secondary'
                      size='lg'
                      className='w-full'
                      onClick={() => {
                        // Reset game for new game - you might want to implement this
                        navigate(`/lobby/${gameId}`);
                      }}
                    >
                      Start New Game
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </GameContainer>
  );
}
