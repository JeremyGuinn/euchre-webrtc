import type { Route } from "./+types/game";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useGame } from "../contexts/GameContext";
import { Card, CardBack } from "../components/Card";
import { DealerSelection } from "../components/DealerSelection";
import Button from "../components/Button";
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
                className={`text-center ${
                  position === "top" || position === "bottom" ? "" : "transform"
                }`}
              >
                <div
                  className={`
                    inline-block px-3 py-1 rounded-lg text-sm font-medium mb-2
                    ${
                      isCurrentPlayer
                        ? "bg-yellow-400 text-black"
                        : "bg-white/20 text-white"
                    }
                    ${!player.isConnected ? "opacity-50" : ""}
                  `}
                >
                  {player.name} {player.id === myPlayer.id && "(You)"}
                  {!player.isConnected && " (Disconnected)"}
                  {gameState.currentDealerId === player.id && " (Dealer)"}
                </div>

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
                          ${
                            selectedCard?.id === card.id
                              ? "ring-2 ring-yellow-400"
                              : ""
                          }
                          ${
                            !canPlay(card) &&
                            isMyTurn() &&
                            gameState.phase === "playing"
                              ? "opacity-50"
                              : ""
                          }
                        `}
                          size="medium"
                        />
                      ))
                    : // Other players - show card backs based on remaining cards
                      (() => {
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

        {/* Bidding Interface - appears in play area */}
        {(gameState.phase === "bidding_round1" || gameState.phase === "bidding_round2") && isMyTurn() && (
          <div className="absolute top-40 left-1/2 transform -translate-x-1/2 z-30">
            <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-xl p-4 border border-gray-200">
              {gameState.phase === "bidding_round1" ? (
                // Round 1: Order up/Assist/Take up the kitty suit
                <div className="text-center">
                  <h3 className="text-lg font-bold text-gray-800 mb-3">
                    {myPlayer.id === gameState.currentDealerId ? "Take it up?" : "Order it up?"}
                  </h3>
                  
                  {gameState.kitty && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-600 mb-1">Trump would be:</p>
                      <div className="flex items-center justify-center space-x-1">
                        <span className={`text-xl ${suitColors[gameState.kitty.suit]}`}>
                          {suitSymbols[gameState.kitty.suit]}
                        </span>
                        <span className="font-medium capitalize">{gameState.kitty.suit}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleBid(gameState.kitty!.suit)}
                      className="px-4 py-2"
                    >
                      {myPlayer.id === gameState.currentDealerId ? "Take" : 
                       myPlayer.teamId === gameState.players.find(p => p.id === gameState.currentDealerId)?.teamId ? "Assist" : "Order"}
                    </Button>
                    
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleBid("pass")}
                      className="px-4 py-2"
                    >
                      Pass
                    </Button>
                  </div>
                </div>
              ) : (
                // Round 2: Call any suit except the turned down suit
                <div className="text-center">
                  <h3 className="text-lg font-bold text-gray-800 mb-3">Call Trump</h3>
                  
                  {gameState.turnedDownSuit && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-600">
                        Turned down: <span className={`font-medium ${suitColors[gameState.turnedDownSuit]}`}>
                          {suitSymbols[gameState.turnedDownSuit]} {gameState.turnedDownSuit}
                        </span>
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {(["spades", "hearts", "diamonds", "clubs"] as const)
                      .filter((suit) => suit !== gameState.turnedDownSuit)
                      .map((suit) => (
                        <Button
                          key={suit}
                          variant="ghost"
                          size="sm"
                          onClick={() => handleBid(suit)}
                          className="flex items-center justify-center space-x-1 px-3 py-2"
                        >
                          <span className={`text-lg ${suitColors[suit]}`}>
                            {suitSymbols[suit]}
                          </span>
                          <span className="text-sm capitalize">{suit}</span>
                        </Button>
                      ))}
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleBid("pass")}
                    className="px-4 py-2"
                  >
                    Pass
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Dealer Selection Overlay */}
      {gameState.phase === "dealer_selection" && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-40">
          <div className="bg-black/20 backdrop-blur-sm rounded-lg p-8 max-w-2xl w-full mx-4">
            <DealerSelection />
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
    </div>
  );
}
