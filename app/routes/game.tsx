import type { Route } from "./+types/game";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useGame } from "../contexts/GameContext";
import { Card, CardBack } from "../components/Card";
import Button from "../components/Button";
import type { Card as CardType } from "../types/game";

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: `Euchre Game ${params.gameId}` },
    { name: "description", content: "Playing Euchre online with friends" },
  ];
}

const suitSymbols = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣'
};

const suitColors = {
  spades: 'text-black',
  hearts: 'text-red-600',
  diamonds: 'text-red-600',
  clubs: 'text-black'
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
    disconnect 
  } = useGame();
  const { gameId } = params;

  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  const [showBidding, setShowBidding] = useState(false);

  const myPlayer = getMyPlayer();
  const myHand = getMyHand();
  const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayerId);

  useEffect(() => {
    // Redirect to lobby if game hasn't started
    if (gameState.phase === 'lobby') {
      navigate(`/lobby/${gameId}`);
    }
  }, [gameState.phase, gameId, navigate]);

  useEffect(() => {
    // Show bidding interface when it's bidding phase and my turn
    setShowBidding(gameState.phase === 'bidding' && isMyTurn());
  }, [gameState.phase, isMyTurn]);

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
    setShowBidding(false);
  };

  const handleLeaveGame = () => {
    disconnect();
    navigate("/");
  };

  const getPlayerPosition = (player: any, myPosition: number) => {
    const relativePosition = (player.position - myPosition + 4) % 4;
    switch (relativePosition) {
      case 0: return 'bottom';
      case 1: return 'left';
      case 2: return 'top';
      case 3: return 'right';
      default: return 'bottom';
    }
  };

  const getPositionClasses = (position: string) => {
    switch (position) {
      case 'bottom':
        return 'absolute bottom-4 left-1/2 transform -translate-x-1/2';
      case 'left':
        return 'absolute left-4 top-1/2 transform -translate-y-1/2 -rotate-90';
      case 'top':
        return 'absolute top-4 left-1/2 transform -translate-x-1/2 rotate-180';
      case 'right':
        return 'absolute right-4 top-1/2 transform -translate-y-1/2 rotate-90';
      default:
        return '';
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
              Phase: <span className="font-medium capitalize">{gameState.phase.replace('_', ' ')}</span>
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
              Team 1: {gameState.scores.team0} | Team 2: {gameState.scores.team1}
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={handleLeaveGame}
            >
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
            {gameState.currentTrick && gameState.currentTrick.cards.map((playedCard, index) => {
              const player = gameState.players.find(p => p.id === playedCard.playerId);
              if (!player) return null;
              
              const angle = (index * 90) - 45;
              const radius = 80;
              const x = Math.cos(angle * Math.PI / 180) * radius;
              const y = Math.sin(angle * Math.PI / 180) * radius;
              
              return (
                <div
                  key={playedCard.card.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `calc(50% + ${x}px)`,
                    top: `calc(50% + ${y}px)`
                  }}
                >
                  <Card card={playedCard.card} size="small" />
                </div>
              );
            })}

            {/* Kitty card (during bidding) */}
            {gameState.phase === 'bidding' && gameState.kitty && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <Card card={gameState.kitty} size="small" />
              </div>
            )}
          </div>
        </div>

        {/* Players around the table */}
        {gameState.players.map((player) => {
          const position = getPlayerPosition(player, myPlayer.position);
          const isCurrentPlayer = player.id === gameState.currentPlayerId;
          
          return (
            <div
              key={player.id}
              className={getPositionClasses(position)}
            >
              <div className={`text-center ${position === 'top' || position === 'bottom' ? '' : 'transform'}`}>
                <div
                  className={`
                    inline-block px-3 py-1 rounded-lg text-sm font-medium mb-2
                    ${isCurrentPlayer ? 'bg-yellow-400 text-black' : 'bg-white/20 text-white'}
                    ${!player.isConnected ? 'opacity-50' : ''}
                  `}
                >
                  {player.name} {player.id === myPlayer.id && '(You)'}
                  {!player.isConnected && ' (Disconnected)'}
                </div>
                
                {/* Player's cards (face down for others, face up for self) */}
                <div className="flex space-x-1">
                  {player.id === myPlayer.id ? (
                    // My hand - show actual cards
                    myHand.map((card) => (
                      <Card
                        key={card.id}
                        card={card}
                        onClick={() => handleCardClick(card)}
                        disabled={!isMyTurn() || gameState.phase !== 'playing' || !canPlay(card)}
                        className={`
                          ${selectedCard?.id === card.id ? 'ring-2 ring-yellow-400' : ''}
                          ${!canPlay(card) && isMyTurn() && gameState.phase === 'playing' ? 'opacity-50' : ''}
                        `}
                        size="medium"
                      />
                    ))
                  ) : (
                    // Other players - show card backs
                    Array.from({ length: 5 }).map((_, index) => (
                      <CardBack key={index} size="small" />
                    ))
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Current turn indicator */}
        {currentPlayer && (
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-white text-center">
            <div className="bg-black/50 px-4 py-2 rounded-lg">
              {currentPlayer.id === myPlayer.id ? (
                <span className="font-medium text-yellow-400">Your turn!</span>
              ) : (
                <span>Waiting for {currentPlayer.name}...</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bidding Modal */}
      {showBidding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">Make Your Bid</h2>
            
            {gameState.kitty && (
              <div className="text-center mb-4">
                <p className="text-sm text-gray-600 mb-2">Turned up card:</p>
                <div className="inline-block">
                  <Card card={gameState.kitty} size="medium" />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {(['spades', 'hearts', 'diamonds', 'clubs'] as const).map((suit) => (
                <Button
                  key={suit}
                  variant="ghost"
                  onClick={() => handleBid(suit)}
                  className="flex items-center justify-center space-x-2 p-3"
                >
                  <span className={`text-2xl ${suitColors[suit]}`}>
                    {suitSymbols[suit]}
                  </span>
                  <span className="font-medium capitalize">{suit}</span>
                </Button>
              ))}
            </div>

            <div className="mt-4 space-y-2">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => handleBid('pass')}
              >
                Pass
              </Button>
            </div>

            <div className="mt-4 text-xs text-gray-500 text-center">
              Click a suit to bid or pass to skip your turn
            </div>
          </div>
        </div>
      )}

      {/* Connection status indicator */}
      {connectionStatus !== 'connected' && (
        <div className="fixed top-20 right-4 bg-red-600 text-white px-4 py-2 rounded-lg text-sm z-50">
          Connection: {connectionStatus}
        </div>
      )}
    </div>
  );
}
