import React from "react";
import { useGame } from "../contexts/GameContext";
import { Card } from "./Card";
import Button from "./Button";

export function DealerSelection() {
  const {
    gameState,
    isHost,
    getMyPlayer,
    selectDealer,
    drawDealerCard,
    completeDealerSelection,
  } = useGame();

  const myPlayer = getMyPlayer();
  if (!myPlayer) return null;

  const hasDrawn = gameState.dealerSelectionCards?.[myPlayer.id];
  const allPlayersDrawn = gameState.players.every(
    (p) => gameState.dealerSelectionCards?.[p.id]
  );

  // Host needs to initiate dealer selection
  if (!gameState.dealerSelectionCards) {
    const getDealerSelectionDescription = () => {
      if (gameState.options.dealerSelection === 'random_cards') {
        if (gameState.options.teamSelection === 'random_cards') {
          return "Each player will draw a card to determine the dealer and teams. The player with the lowest card deals first. The two players with the lowest cards form one team.";
        } else {
          return "Each player will draw a card to determine the dealer. The player with the lowest card deals first. Teams remain as arranged in the lobby.";
        }
      } else {
        return "The dealer will be determined by dealing cards around the table until someone receives a black Jack.";
      }
    };

    return (
      <div className="flex flex-col items-center space-y-4 text-white">
        <h2 className="text-2xl font-bold">Dealer Selection</h2>
        <p className="text-center max-w-md">
          {getDealerSelectionDescription()}
        </p>

        {(isHost && (
          <Button onClick={selectDealer}>
            {gameState.options.dealerSelection === 'random_cards' ? 'Start Card Drawing' : 'Find First Black Jack'}
          </Button>
        )) || <div className="text-gray-400">Waiting for host...</div>}
      </div>
    );
  }

  // Show card drawing interface
  if (gameState.dealerSelectionCards && !allPlayersDrawn) {
    return (
      <div className="flex flex-col items-center space-y-6 text-white">
        <h2 className="text-2xl font-bold">Dealer Selection</h2>
        <p className="text-center">
          Each player draws a card to determine dealer and teams
        </p>

        {/* Show drawn cards */}
        <div className="grid grid-cols-2 gap-4">
          {gameState.players.map((player) => {
            const drawnCard = gameState.dealerSelectionCards?.[player.id];
            return (
              <div
                key={player.id}
                className="flex flex-col items-center space-y-2"
              >
                <div className="text-sm font-medium">{player.name}</div>
                <div className="w-16 h-24 border border-white/30 rounded-lg flex items-center justify-center">
                  {drawnCard ? (
                    <Card card={drawnCard} size="small" />
                  ) : player.id === myPlayer.id ? (
                    hasDrawn ? (
                      <div className="text-xs text-center">
                        Waiting for others...
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        onClick={drawDealerCard}
                        className="text-xs py-1 px-2"
                      >
                        Draw Card
                      </Button>
                    )
                  ) : (
                    <div className="text-xs text-center text-gray-400">
                      {player.isConnected ? "Thinking..." : "Disconnected"}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {hasDrawn && (
          <div className="text-center">
            <p className="text-green-300">You drew your card!</p>
            <p className="text-sm text-gray-300">
              Waiting for other players...
            </p>
          </div>
        )}
      </div>
    );
  }

  // All players have drawn - show results and complete selection
  if (allPlayersDrawn && isHost) {
    return (
      <div className="flex flex-col items-center space-y-6 text-white">
        <h2 className="text-2xl font-bold">Dealer Selection Complete</h2>

        {/* Show all drawn cards */}
        <div className="grid grid-cols-2 gap-4">
          {gameState.players.map((player) => {
            const drawnCard = gameState.dealerSelectionCards?.[player.id];
            return (
              <div
                key={player.id}
                className="flex flex-col items-center space-y-2"
              >
                <div className="text-sm font-medium">{player.name}</div>
                {drawnCard && <Card card={drawnCard} size="small" />}
              </div>
            );
          })}
        </div>

        <Button onClick={completeDealerSelection}>
          Finalize Teams and Start Game
        </Button>
      </div>
    );
  }

  // Show waiting message for non-host players
  if (allPlayersDrawn) {
    return (
      <div className="flex flex-col items-center space-y-4 text-white">
        <h2 className="text-2xl font-bold">Dealer Selection Complete</h2>
        <p>Waiting for host to finalize teams...</p>

        {/* Show all drawn cards */}
        <div className="grid grid-cols-2 gap-4">
          {gameState.players.map((player) => {
            const drawnCard = gameState.dealerSelectionCards?.[player.id];
            return (
              <div
                key={player.id}
                className="flex flex-col items-center space-y-2"
              >
                <div className="text-sm font-medium">{player.name}</div>
                {drawnCard && <Card card={drawnCard} size="small" />}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}
