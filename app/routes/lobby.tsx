import type { Route } from "./+types/lobby";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useGame } from "../contexts/GameContext";
import { useIsClient } from "../hooks/useClientOnly";
import Button from "../components/Button";
import PlayerCard from "../components/PlayerCard";
import HostControlsInfo from "../components/HostControlsInfo";
import GameOptionsPanel from "../components/GameOptionsPanel";
import Input from "../components/Input";
import { normalizeGameCode } from "~/utils/gameCode";

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: `Game Lobby ${params.gameId} - Euchre Online` },
    {
      name: "description",
      content: "Waiting for players to join the Euchre game",
    },
  ];
}

export default function Lobby({ params }: Route.ComponentProps) {
  const navigate = useNavigate();
  const isClientSide = useIsClient();
  const {
    gameState,
    isHost,
    startGame,
    connectionStatus,
    getMyPlayer,
    disconnect,
    renamePlayer,
    kickPlayer,
    movePlayer,
    updateGameOptions,
  } = useGame();
  const { gameId } = params;

  const [draggedPlayer, setDraggedPlayer] = useState<string | null>(null);

  const myPlayer = getMyPlayer();
  const connectedPlayers = gameState.players.filter((p) => p.isConnected);
  const canStartGame = isHost && connectedPlayers.length === 4;

  useEffect(() => {
    if (connectionStatus === "disconnected") {
      navigate(`/`);
    }
  }, [connectionStatus, navigate]);

  useEffect(() => {
    // Redirect to game if it has started
    if (gameState.phase !== "lobby") {
      navigate(`/game/${gameId}`);
    }
  }, [gameState.phase, gameId, navigate]);

  const handleStartGame = () => {
    if (canStartGame) {
      startGame();
    }
  };

  const handleLeaveGame = () => {
    disconnect();
    navigate("/");
  };

  const copyGameLink = () => {
    if (isClientSide && typeof window !== "undefined") {
      const gameLink = `${window.location.origin}${window.__reactRouterContext?.basename || ""}join/${gameId}`;
      navigator.clipboard.writeText(gameLink);
    }
  };

  const copyGameCode = () => {
    if (isClientSide && typeof navigator !== "undefined") {
      navigator.clipboard.writeText(gameId);
    }
  };

  const handleRenamePlayer = (playerId: string, newName: string) => {
    if ((isHost || playerId === myPlayer?.id) && newName.trim()) {
      renamePlayer(playerId, newName.trim());
    }
  };

  const handleKickPlayer = (playerId: string) => {
    if (isHost && playerId !== myPlayer?.id) {
      kickPlayer(playerId);
    }
  };

  const handleMovePlayer = (playerId: string, newPosition: 0 | 1 | 2 | 3) => {
    if (isHost) {
      movePlayer(playerId, newPosition);
    }
  };

  const handleDragStart = (playerId: string) => {
    if (isHost) {
      setDraggedPlayer(playerId);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, position: 0 | 1 | 2 | 3) => {
    e.preventDefault();
    if (draggedPlayer && isHost) {
      handleMovePlayer(draggedPlayer, position);
      setDraggedPlayer(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 to-green-600 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-800">Game Lobby</h1>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Status:{" "}
                <span
                  className={`font-medium ${connectionStatus === "connected"
                    ? "text-green-600"
                    : connectionStatus === "connecting"
                      ? "text-yellow-600"
                      : connectionStatus === "error"
                        ? "text-red-600"
                        : "text-gray-600"
                    }`}
                >
                  {connectionStatus}
                </span>
              </div>
              <Button
                variant="danger"
                onClick={handleLeaveGame}
                size="sm"
              >
                Leave Game
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <Input
                label="Game Code"
                value={normalizeGameCode(gameId)}
                readOnly
                variant="readonly"
                className="text-center font-mono"
                fullWidth
                copyButton
                onCopy={copyGameCode}
              />
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <Input
                label="Invite Link"
                value={
                  isClientSide && typeof window !== "undefined"
                    ? `${window.location.origin}${window.__reactRouterContext?.basename || ""}join/${gameId}`
                    : ""
                }
                readOnly
                variant="readonly"
                className="text-sm"
                fullWidth
                copyButton
                onCopy={copyGameLink}
              />
            </div>
          </div>
        </div>

        {/* Main content - responsive layout */}
        <div className="space-y-6">
          {/* Left Column - Players (takes up 2/3 on large screens) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Players ({connectedPlayers.length}/4)
              </h2>

              <div className="space-y-3">
                {gameState.options?.teamSelection === 'predetermined' ? (
                  // Team-based layout for predetermined teams
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Team 0 */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h3 className="font-medium text-blue-800 mb-3 text-center">
                        Team 1
                      </h3>
                      <div className="space-y-2">
                        {[0, 2].map((position) => {
                          const player = gameState.players.find(
                            (p) => p.position === position
                          );
                          return (
                            <div
                              key={position}
                              className={`transition-all ${player
                                ? player.isConnected
                                  ? ""
                                  : "opacity-75"
                                : "border-dashed border-gray-300 bg-gray-50"
                                } ${isHost && !player ? "hover:border-blue-400" : ""}`}
                              onDragOver={handleDragOver}
                              onDrop={(e) => handleDrop(e, position as 0 | 1 | 2 | 3)}
                            >
                              {player ? (
                                <PlayerCard
                                  player={player}
                                  isCurrentUser={player.id === myPlayer?.id}
                                  isHost={isHost}
                                  canEdit={isHost || player.id === myPlayer?.id}
                                  canKick={isHost && player.id !== myPlayer?.id}
                                  canDrag={isHost && player.id !== myPlayer?.id}
                                  onRename={handleRenamePlayer}
                                  onKick={handleKickPlayer}
                                  onDragStart={handleDragStart}
                                />
                              ) : (
                                <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                                  <div className="flex items-center justify-center text-gray-500">
                                    <span className="text-sm font-medium">Waiting for player...</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Team 1 */}
                    <div className="bg-red-50 rounded-lg p-4">
                      <h3 className="font-medium text-red-800 mb-3 text-center">
                        Team 2
                      </h3>
                      <div className="space-y-2">
                        {[1, 3].map((position) => {
                          const player = gameState.players.find(
                            (p) => p.position === position
                          );
                          return (
                            <div
                              key={position}
                              className={`transition-all ${player
                                ? player.isConnected
                                  ? ""
                                  : "opacity-75"
                                : "border-dashed border-gray-300 bg-gray-50"
                                } ${isHost && !player ? "hover:border-red-400" : ""}`}
                              onDragOver={handleDragOver}
                              onDrop={(e) => handleDrop(e, position as 0 | 1 | 2 | 3)}
                            >
                              {player ? (
                                <PlayerCard
                                  player={player}
                                  isCurrentUser={player.id === myPlayer?.id}
                                  isHost={isHost}
                                  canEdit={isHost || player.id === myPlayer?.id}
                                  canKick={isHost && player.id !== myPlayer?.id}
                                  canDrag={isHost && player.id !== myPlayer?.id}
                                  onRename={handleRenamePlayer}
                                  onKick={handleKickPlayer}
                                  onDragStart={handleDragStart}
                                />
                              ) : (
                                <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                                  <div className="flex items-center justify-center text-gray-500">
                                    <span className="text-sm font-medium">Waiting for player...</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  // Simple list layout for random card teams
                  <div className="space-y-3">
                    <div className="text-sm text-gray-600 text-center mb-4">
                      Teams will be determined by card selection when the game starts
                    </div>

                    {gameState.players.length === 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3">
                        {Array.from({ length: 4 }).map((_, index) => (
                          <div key={index} className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                            <div className="flex items-center justify-center text-gray-500">
                              <span className="text-sm font-medium">Waiting for player...</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3">
                        {gameState.players.map((player) => (
                          <PlayerCard
                            key={player.id}
                            player={player}
                            isCurrentUser={player.id === myPlayer?.id}
                            isHost={isHost}
                            canEdit={isHost || player.id === myPlayer?.id}
                            canKick={isHost && player.id !== myPlayer?.id}
                            canDrag={false} // No dragging for random teams
                            onRename={handleRenamePlayer}
                            onKick={handleKickPlayer}
                            onDragStart={handleDragStart}
                          />
                        ))}
                        {/* Show empty slots for remaining players */}
                        {Array.from({ length: Math.max(0, 4 - gameState.players.length) }).map((_, index) => (
                          <div key={`empty-${index}`} className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                            <div className="flex items-center justify-center text-gray-500">
                              <span className="text-sm font-medium">Waiting for player...</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Host Controls Info */}
                <HostControlsInfo isHost={isHost} />
              </div>
            </div>

            <GameOptionsPanel
              options={gameState.options}
              onOptionsChange={updateGameOptions}
              isHost={isHost}
              disabled={gameState.phase !== 'lobby'}
            />

            {/* Game Controls */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-center">
                {connectedPlayers.length < 4 ? (
                  <div>
                    <p className="text-gray-600 mb-4">
                      Waiting for {4 - connectedPlayers.length} more player
                      {4 - connectedPlayers.length !== 1 ? "s" : ""} to join...
                    </p>
                    <div className="text-sm text-gray-500">
                      Share the game code or invite link with your friends
                    </div>
                  </div>
                ) : isHost ? (
                  <div>
                    <p className="text-green-600 font-medium mb-4">
                      All players connected! Ready to start the game.
                    </p>
                    <Button
                      variant="success"
                      size="lg"
                      onClick={handleStartGame}
                    >
                      Start Game
                    </Button>
                  </div>
                ) : (
                  <div>
                    <p className="text-green-600 font-medium">
                      All players connected! Waiting for host to start the game.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
