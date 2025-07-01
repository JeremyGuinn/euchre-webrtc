import type { Route } from "./+types/join";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useGame } from "../contexts/GameContext";
import { useClientOnly } from "../hooks/useClientOnly";
import { isValidGameCode } from "../utils/gameCode";
import Button from "../components/Button";
import LinkButton from "../components/LinkButton";
import Input from "../components/Input";

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: `Join Game ${params.gameId} - Euchre Online` },
    { name: "description", content: "Join a Euchre game with friends" },
  ];
}

export default function Join({ params }: Route.ComponentProps) {
  const navigate = useNavigate();
  const isClientSide = useClientOnly();
  const { joinGame, connectionStatus, getDisplayGameCode } = useGame();
  const { gameId } = params;

  const [playerName, setPlayerName] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Validate the game code
    if (!isValidGameCode(gameId)) {
      setError("Invalid game code. Please check the code and try again.");
      return;
    }

    // Check if we have a saved player name (only on client side)
    if (isClientSide && typeof sessionStorage !== "undefined") {
      const savedName = sessionStorage.getItem('euchre-player-name');
      if (savedName) {
        setPlayerName(savedName);
      }
    }
  }, [gameId, isClientSide]);

  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!playerName.trim()) {
      setError("Please enter your name");
      return;
    }

    setIsJoining(true);
    setError("");

    try {
      // Save player name for future use (only on client side)
      if (isClientSide && typeof sessionStorage !== "undefined") {
        sessionStorage.setItem('euchre-player-name', playerName.trim());
      }

      await joinGame(gameId, playerName.trim());

      // Navigate to lobby using the original gameId parameter
      navigate(`/lobby/${gameId}`);
    } catch (err) {
      console.error("Failed to join game:", err);
      setError("Failed to join game. Please check the game code and try again.");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 to-green-600 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Join Game</h1>
          <p className="text-gray-600">
            Game Code: <span className="font-mono font-semibold">{gameId}</span>
          </p>
        </div>

        <form onSubmit={handleJoinGame} className="space-y-6">
          <Input
            label="Your Name"
            id="playerName"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name"
            maxLength={20}
            required
            disabled={isJoining}
            fullWidth
          />

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="text-red-500 mr-2">⚠️</div>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
            <span>Connection Status:</span>
            <span className={`font-medium ${connectionStatus === 'connected' ? 'text-green-600' :
                connectionStatus === 'connecting' ? 'text-yellow-600' :
                  connectionStatus === 'error' ? 'text-red-600' :
                    'text-gray-600'
              }`}>
              {connectionStatus}
            </span>
          </div>

          <Button
            type="submit"
            variant="success"
            size="lg"
            fullWidth
            disabled={!playerName.trim()}
            loading={isJoining}
          >
            {isJoining ? "Joining..." : "Join Game"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <LinkButton
            to="/"
            variant="text"
            size="sm"
          >
            ← Back to Home
          </LinkButton>
        </div>
      </div>
    </div>
  );
}
