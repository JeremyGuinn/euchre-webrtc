import type { Route } from "./+types/game";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useGame } from "../contexts/GameContext";
import { Card, CardBack } from "../components/ui/Card";
import { DealingAnimation } from "../components/game/DealingAnimation";
import Button from "../components/ui/Button";
import type { Card as CardType } from "../types/game";

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: `Euchre Game ${params.gameId}` },
    { name: "description", content: "Playing Euchre online with friends" },
  ];
}

const suitSymbols = {
  spades: "♠",
  hearts: "♥",
  diamonds: "♦",
  clubs: "♣",
};

const suitColors = {
  spades: "text-black",
  hearts: "text-red-600",
  diamonds: "text-red-600",
  clubs: "text-black",
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
    dealerDiscard,
    drawDealerCard,
    completeDealerSelection,
    proceedToDealing,
    completeDealingAnimation,
    selectDealer,
    disconnect,
  } = useGame();
  const { gameId } = params;

  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  const [showDealerDiscard, setShowDealerDiscard] = useState(false);

  const myPlayer = getMyPlayer();
  const myHand = getMyHand();
  const currentPlayer = gameState.players.find(
    (p) => p.id === gameState.currentPlayerId
  );

  useEffect(() => {
    // Redirect to lobby if game hasn't started
    if (gameState.phase === "lobby") {
      navigate(`/lobby/${gameId}`);
    }
  }, [gameState.phase, gameId, navigate]);

  useEffect(() => {
    // Show dealer discard interface when dealer took up the kitty and needs to discard
    setShowDealerDiscard(
      gameState.phase === "playing" &&
      myPlayer?.id === gameState.currentDealerId &&
      gameState.trump === gameState.kitty?.suit &&
      myHand.length === 6 // Dealer has 6 cards (5 + kitty)
    );
  }, [
    gameState.phase,
    gameState.trump,
    gameState.kitty,
    myPlayer?.id,
    gameState.currentDealerId,
    myHand.length,
  ]);

  const handleCardClick = (card: CardType) => {
    if (!isMyTurn() || gameState.phase !== "playing") return;

    if (!canPlay(card)) {
      // Show error feedback
      return;
    }

    playCard(card);
  };

  const handleBid = (
    suit: CardType["suit"] | "pass",
    alone: boolean = false
  ) => {
    placeBid(suit, alone);
  };

  const handleLeaveGame = () => {
    disconnect();
    navigate("/");
  };

  const getPlayerPosition = (player: any, myPosition: number) => {
    const relativePosition = (player.position - myPosition + 4) % 4;
    switch (relativePosition) {
      case 0:
        return "bottom";
      case 1:
        return "left";
      case 2:
        return "top";
      case 3:
        return "right";
      default:
        return "bottom";
    }
  };

  const getPositionClasses = (position: string) => {
    switch (position) {
      case "bottom":
        return "absolute bottom-8 left-1/2 transform -translate-x-1/2";
      case "left":
        return "absolute left-4 top-1/2 transform -translate-y-1/2 -rotate-90";
      case "top":
        return "absolute top-4 left-1/2 transform -translate-x-1/2 rotate-180";
      case "right":
        return "absolute right-4 top-1/2 transform -translate-y-1/2 rotate-90";
      default:
        return "";
    }
  };

  const getAvailableCardsCount = () => {
    if (!gameState.dealerSelectionCards) return 0;

    // Use the deck array length (which is now always available with placeholders)
    const totalDeckSize = gameState.deck.length;
    const drawnCardsCount = Object.keys(gameState.dealerSelectionCards).length;

    return Math.max(0, totalDeckSize - drawnCardsCount);
  };

  const shouldShowCards = () => {
    return gameState.phase === "bidding_round1"
      || gameState.phase === "bidding_round2"
      || gameState.phase === "playing"
      || gameState.phase === "trick_complete";
  };

  if (!myPlayer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-800 to-green-600 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading game...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 to-green-600 relative overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-black/20 p-4 z-10">
        <div className="flex justify-between items-center text-white">
          <div className="flex items-center space-x-6">
            <h1 className="text-xl font-bold">Euchre Game</h1>
            <div className="text-sm">
              Phase:{" "}
              <span className="font-medium capitalize">
                {gameState.phase.replace("_", " ")}
              </span>
            </div>
            {gameState.trump && (
              <div className="flex items-center space-x-1">
                <span className="text-sm">Trump:</span>
                <span className={`text-lg ${suitColors[gameState.trump]}`}>
                  {suitSymbols[gameState.trump]}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm">
              Team 1: {gameState.scores.team0} | Team 2:{" "}
              {gameState.scores.team1}
            </div>
            <Button variant="danger" size="sm" onClick={handleLeaveGame}>
              Leave
            </Button>
          </div>
        </div>
      </div>

      {/* Game Table */}
      <div className="relative w-full h-screen pt-16">
        {/* Center area for tricks */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-64 h-64 bg-green-700 rounded-full border-4 border-yellow-600 relative">
            {/* Current trick cards */}
            {gameState.currentTrick &&
              gameState.currentTrick.cards.map((playedCard) => {
                const player = gameState.players.find(
                  (p) => p.id === playedCard.playerId
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
                  case "bottom":
                    angle = 180;
                    break; // 6 o'clock
                  case "left":
                    angle = 270;
                    break; // 9 o'clock
                  case "top":
                    angle = 0;
                    break; // 12 o'clock
                  case "right":
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
                    className="absolute transform -translate-x-1/2 -translate-y-1/2"
                    style={{
                      left: `calc(50% + ${x}px)`,
                      top: `calc(50% + ${y}px)`,
                    }}
                  >
                    <Card card={playedCard.card} size="medium" />
                  </div>
                );
              })}

            {/* Kitty card (during bidding) */}
            {(gameState.phase === "bidding_round1" ||
              gameState.phase === "bidding_round2") &&
              gameState.kitty && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <CardBack
                    size="medium"
                    className="absolute top-0 left-0 opacity-60"
                  />
                  <CardBack
                    size="medium"
                    className="absolute top-0.5 left-0.5 opacity-80"
                  />
                  <CardBack size="medium" className="absolute top-1 left-1" />

                  {(gameState.phase === "bidding_round1" && (
                    <Card
                      card={gameState.kitty}
                      size="medium"
                      className="relative z-10"
                    />
                  )) || <CardBack size="medium" className="relative z-10" />}
                </div>
              )}
          </div>
        </div>

        {/* Players around the table */}
        {gameState.players.map((player) => {
          const position = getPlayerPosition(player, myPlayer.position);
          const isCurrentPlayer = player.id === gameState.currentPlayerId;

          return (
            <div key={player.id} className={getPositionClasses(position)}>
              <div
                className={`text-center ${position === "top" || position === "bottom" ? "" : "transform"
                  }`}
              >
                {gameState.phase !== 'dealing_animation' && (<div
                  className={`
                    inline-block px-3 py-1 rounded-lg text-sm font-medium mb-2
                    ${isCurrentPlayer
                      ? "bg-yellow-400 text-black"
                      : "bg-white/20 text-white"
                    }
                    ${!player.isConnected ? "opacity-50" : ""}
                  `}
                >
                  {player.name} {player.id === myPlayer.id && "(You)"}
                  {!player.isConnected && " (Disconnected)"}
                  {gameState.currentDealerId === player.id && " (Dealer)"}
                </div>)}

                {/* Player's cards (face down for others, face up for self) */}
                <div className="flex space-x-1">
                  {player.id === myPlayer.id
                    ? // My hand - show actual cards
                    myHand.map((card) => (
                      <Card
                        key={card.id}
                        card={card}
                        onClick={() => handleCardClick(card)}
                        disabled={
                          !isMyTurn() ||
                          gameState.phase !== "playing" ||
                          !canPlay(card)
                        }
                        className={`
                          ${selectedCard?.id === card.id
                            ? "ring-2 ring-yellow-400"
                            : ""
                          }
                          ${!canPlay(card) &&
                            isMyTurn() &&
                            gameState.phase === "playing"
                            ? "opacity-50"
                            : ""
                          }
                        `}
                        size="medium"
                      />
                    ))
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
                        const cardsPlayedInCompletedTricks = gameState.completedTricks
                          .flatMap(trick => trick.cards)
                          .filter(playedCard => playedCard.playerId === player.id)
                          .length;
                        cardsRemaining -= cardsPlayedInCompletedTricks;
                      }

                      // Count cards played in current trick
                      if (gameState.currentTrick) {
                        const cardsPlayedInCurrentTrick = gameState.currentTrick.cards
                          .filter(playedCard => playedCard.playerId === player.id)
                          .length;
                        cardsRemaining -= cardsPlayedInCurrentTrick;
                      }

                      // Ensure we don't show negative cards
                      cardsRemaining = Math.max(0, cardsRemaining);

                      return Array.from({ length: cardsRemaining }).map((_, index) => (
                        <CardBack key={index} size="small" />
                      ));
                    })()}
                </div>
              </div>
            </div>
          );
        })}

        {/* Current turn indicator */}
        {currentPlayer && (
          <div className="absolute bottom-48 left-1/2 transform -translate-x-1/2 text-white text-center z-20">
            <div className="bg-black/70 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg border border-white/20">
              {currentPlayer.id === myPlayer.id ? (
                <span className="font-medium text-yellow-400">Your turn!</span>
              ) : (
                <span>Waiting for {currentPlayer.name}...</span>
              )}
            </div>
          </div>
        )}

        {/* Bidding Interface - positioned below player's hand */}
        {(gameState.phase === "bidding_round1" || gameState.phase === "bidding_round2") && isMyTurn() && (
          <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-30">
            <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-xl p-3 border border-gray-200 max-w-xs">
              {gameState.phase === "bidding_round1" ? (
                // Round 1: Order up/Assist/Take up the kitty suit
                <div className="text-center">
                  <h3 className="text-sm font-bold text-gray-800 mb-2">
                    {myPlayer.id === gameState.currentDealerId ? "Take it up?" : "Order it up?"}
                  </h3>

                  {gameState.kitty && (
                    <div className="mb-2">
                      <p className="text-xs text-gray-600 mb-1">Trump would be:</p>
                      <div className="flex items-center justify-center space-x-1">
                        <span className={`text-lg ${suitColors[gameState.kitty.suit]}`}>
                          {suitSymbols[gameState.kitty.suit]}
                        </span>
                        <span className="text-xs font-medium capitalize">{gameState.kitty.suit}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-2 justify-center">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleBid(gameState.kitty!.suit)}
                      className="px-3 py-1 text-xs"
                    >
                      {myPlayer.id === gameState.currentDealerId ? "Take" :
                        myPlayer.teamId === gameState.players.find(p => p.id === gameState.currentDealerId)?.teamId ? "Assist" : "Order"}
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleBid("pass")}
                      className="px-3 py-1 text-xs"
                    >
                      Pass
                    </Button>
                  </div>
                </div>
              ) : (
                // Round 2: Call any suit except the turned down suit
                <div className="text-center">
                  <h3 className="text-sm font-bold text-gray-800 mb-2">Call Trump</h3>

                  {gameState.turnedDownSuit && (
                    <div className="mb-2">
                      <p className="text-xs text-gray-600">
                        Turned down: <span className={`font-medium ${suitColors[gameState.turnedDownSuit]}`}>
                          {suitSymbols[gameState.turnedDownSuit]} {gameState.turnedDownSuit}
                        </span>
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-1 mb-2">
                    {(["spades", "hearts", "diamonds", "clubs"] as const)
                      .filter((suit) => suit !== gameState.turnedDownSuit)
                      .map((suit) => (
                        <Button
                          key={suit}
                          variant="ghost"
                          size="sm"
                          onClick={() => handleBid(suit)}
                          className="flex items-center justify-center space-x-1 px-2 py-1 text-xs"
                        >
                          <span className={`text-sm ${suitColors[suit]}`}>
                            {suitSymbols[suit]}
                          </span>
                          <span className="text-xs capitalize">{suit}</span>
                        </Button>
                      ))}
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleBid("pass")}
                    className="px-3 py-1 text-xs"
                  >
                    Pass
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Dealer Selection - Spread Deck Interface */}
      {gameState.phase === "dealer_selection" && (
        <div className="absolute inset-0 bg-black/40 z-40">
          <div className="flex flex-col items-center justify-center h-full p-8">
            <div className="text-white text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Dealer Selection</h2>

              {!gameState.dealerSelectionCards ? (
                // Initial state - need to start dealer selection
                <>
                  <p className="text-lg mb-4">
                    {gameState.options.dealerSelection === 'random_cards'
                      ? "Each player will draw a card to determine the dealer and teams. The player with the lowest card deals first."
                      : "The dealer will be determined by dealing cards around the table until someone receives a black Jack."
                    }
                  </p>
                  {gameState.options.teamSelection === 'random_cards' && gameState.options.dealerSelection === 'random_cards' && (
                    <p className="text-sm text-gray-300 mb-6">
                      The two players with the lowest cards will form one team.
                    </p>
                  )}

                  {isHost ? (
                    <Button onClick={selectDealer} size="lg">
                      {gameState.options.dealerSelection === 'random_cards' ? 'Start Card Drawing' : 'Find First Black Jack'}
                    </Button>
                  ) : (
                    <div className="text-gray-400">Waiting for host to start...</div>
                  )}
                </>
              ) : (
                // Card drawing in progress
                <>
                  <p className="text-lg mb-2">
                    Each player draws a card to determine dealer and teams
                  </p>
                  <p className="text-sm text-gray-300">
                    Click on a card from the spread deck below
                  </p>
                </>
              )}
            </div>

            {/* Show drawn cards for each player - only if selection has started */}
            {gameState.dealerSelectionCards && (
              <div className="flex justify-center space-x-8 mb-8">
                {gameState.players.map((player) => {
                  const drawnCard = gameState.dealerSelectionCards?.[player.id];
                  const hasDrawn = !!drawnCard;
                  const isMyTurn = player.id === myPlayer.id && !hasDrawn;

                  return (
                    <div
                      key={player.id}
                      className="flex flex-col items-center space-y-2"
                    >
                      <div className={`text-sm font-medium ${isMyTurn ? 'text-yellow-400' : 'text-white'}`}>
                        {player.name} {player.id === myPlayer.id && "(You)"}
                      </div>
                      <div className="w-20 h-28 border-2 border-white/30 rounded-lg flex items-center justify-center bg-green-700/50">
                        {hasDrawn ? (
                          <Card card={drawnCard} size="small" />
                        ) : isMyTurn ? (
                          <div className="text-xs text-center text-yellow-400 font-medium">
                            Your Turn!<br />Pick a Card
                          </div>
                        ) : (
                          <div className="text-xs text-center text-gray-400">
                            {player.isConnected ? "Waiting..." : "Disconnected"}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Spread Deck - only show if selection has started and cards are available */}
            {gameState.dealerSelectionCards && getAvailableCardsCount() > 0 && (
              <div className="relative">
                <div className="relative w-full h-48 flex items-center justify-center">
                  {/* Create array of face-down cards based on available cards */}
                  {Array.from({ length: Math.min(24, getAvailableCardsCount()) }).map((_, index) => {
                    const canDraw = !gameState.dealerSelectionCards?.[myPlayer.id];
                    const totalCards = Math.min(24, getAvailableCardsCount());

                    // Create an arc from -60 degrees to +60 degrees (120 degree spread)
                    const maxAngle = 60; // degrees
                    const angleStep = totalCards > 1 ? (2 * maxAngle) / (totalCards - 1) : 0;
                    const angle = -maxAngle + index * angleStep;

                    // Position cards along a circular arc
                    const radius = 180; // Distance from center
                    const angleRad = (angle * Math.PI) / 180;
                    const x = Math.sin(angleRad) * radius;
                    // Use cosine for proper circular positioning, but invert and offset to create downward arc
                    const y = (1 - Math.cos(angleRad)) * radius * 0.5; // Creates a downward circular arc

                    return (
                      <button
                        key={index}
                        onClick={() => canDraw && drawDealerCard(index)}
                        disabled={!canDraw}
                        className={`
                          absolute transition-all duration-200 hover:scale-110 hover:-translate-y-4 hover:z-30
                          ${canDraw ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}
                        `}
                        style={{
                          transform: `translate(${x}px, ${y}px) rotate(${angle}deg)`,
                          transformOrigin: 'center bottom',
                          zIndex: 10 + index
                        }}
                      >
                        <CardBack size="medium" />
                      </button>
                    );
                  })}
                </div>

                {!gameState.dealerSelectionCards?.[myPlayer.id] && (
                  <div className="text-center text-white mt-4">
                    <p className="text-sm animate-pulse">Click any card to draw</p>
                  </div>
                )}
              </div>
            )}

            {/* Show completion button for host when all have drawn */}
            {gameState.dealerSelectionCards &&
              Object.keys(gameState.dealerSelectionCards).length === gameState.players.length &&
              isHost && (
                <div className="mt-8">
                  <Button onClick={completeDealerSelection} size="lg">
                    Finalize Teams and Start Game
                  </Button>
                </div>
              )}

            {/* Waiting message for non-host when all have drawn */}
            {gameState.dealerSelectionCards &&
              Object.keys(gameState.dealerSelectionCards).length === gameState.players.length &&
              !isHost && (
                <div className="mt-8 text-center text-white">
                  <p>All cards drawn! Waiting for host to finalize teams...</p>
                </div>
              )}
          </div>
        </div>
      )}

      {/* Dealer Discard Modal */}
      {showDealerDiscard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
              Discard a Card
            </h2>

            <p className="text-sm text-gray-600 mb-4 text-center">
              You picked up the{" "}
              {gameState.kitty && (
                <span
                  className={`font-bold ${suitColors[gameState.kitty.suit]}`}
                >
                  {suitSymbols[gameState.kitty.suit]} {gameState.kitty.value}
                </span>
              )}
              . Choose a card to discard:
            </p>

            <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
              {myHand.map((card) => (
                <button
                  key={card.id}
                  onClick={() => {
                    dealerDiscard(card);
                    setShowDealerDiscard(false);
                  }}
                  className="hover:scale-105 transform transition-transform"
                >
                  <Card card={card} size="small" />
                </button>
              ))}
            </div>

            <div className="mt-4 text-xs text-gray-500 text-center">
              Click a card to discard it and start play
            </div>
          </div>
        </div>
      )}

      {/* Connection status indicator */}
      {connectionStatus !== "connected" && (
        <div className="fixed top-20 right-4 bg-red-600 text-white px-4 py-2 rounded-lg text-sm z-50">
          Connection: {connectionStatus}
        </div>
      )}

      {/* Team Summary - Show dealer and team assignments */}
      {gameState.phase === "team_summary" && (
        <div className="absolute inset-0 bg-black/40 z-40">
          <div className="flex flex-col items-center justify-center h-full p-8">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-8 max-w-2xl w-full mx-4">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Team Assignments</h2>
                <p className="text-gray-600">Here are the teams and dealer for this hand</p>
              </div>

              {/* Dealer Information */}
              <div className="text-center mb-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                {(() => {
                  const dealer = gameState.players.find(p => p.id === gameState.currentDealerId);
                  return (
                    <div>
                      <h3 className="text-lg font-semibold text-yellow-800 mb-1">Dealer</h3>
                      <p className="text-xl font-bold text-yellow-900">
                        {dealer?.name || 'Unknown'}
                        {dealer?.id === myPlayer.id && ' (You)'}
                      </p>
                      <p className="text-sm text-yellow-700 mt-1">
                        The dealer will deal the cards and has the final bidding option
                      </p>
                    </div>
                  );
                })()}
              </div>

              {/* Teams Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Team 1 */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-800 mb-3 text-center">Team 1</h3>
                  <div className="space-y-2">
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
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <h3 className="text-lg font-semibold text-red-800 mb-3 text-center">Team 2</h3>
                  <div className="space-y-2">
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
                <div className="text-center mb-6 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Random Teams:</span> Teams were determined by the cards drawn.
                    The two players with the lowest cards form Team 1.
                  </p>
                </div>
              )}

              {gameState.options.teamSelection === 'predetermined' && (
                <div className="text-center mb-6 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Predetermined Teams:</span> Teams are set by seating position.
                    Players sitting across from each other are teammates.
                  </p>
                </div>
              )}

              {/* Scores */}
              <div className="flex justify-center space-x-8 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{gameState.scores.team0}</div>
                  <div className="text-sm text-gray-600">Team 1 Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{gameState.scores.team1}</div>
                  <div className="text-sm text-gray-600">Team 2 Score</div>
                </div>
              </div>

              {/* Continue Button */}
              <div className="text-center">
                {isHost ? (
                  <Button onClick={proceedToDealing} size="lg" className="px-8">
                    Deal Cards and Start Hand
                  </Button>
                ) : (
                  <div className="text-gray-600">
                    <div className="inline-flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
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
      {gameState.phase === "dealing_animation" && (
        <DealingAnimation
          players={gameState.players}
          myPlayer={myPlayer}
          isVisible={true}
          onComplete={completeDealingAnimation}
        />
      )}
    </div>
  );
}
