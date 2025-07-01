import type { Route } from "./+types/host";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useGame } from "../contexts/GameContext";
import Button from "../components/Button";
import Input from "../components/Input";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Host Game - Euchre Online" },
    {
      name: "description",
      content: "Host a new Euchre game and invite friends to join",
    },
  ];
}

export default function Host() {
  const navigate = useNavigate();
  const { hostGame, connectionStatus } = useGame();
  const [gameId, setGameId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleHostGame = async () => {
    setIsLoading(true);
    setError("");

    try {
      const newGameId = await hostGame();
      setGameId(newGameId);

      // Navigate to lobby
      setTimeout(() => {
        navigate(`/lobby/${newGameId}`);
      }, 2000);
    } catch (err) {
      console.error("Failed to host game:", err);
      setError("Failed to create game. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyGameLink = () => {
    const gameLink = `${window.location.origin}/join/${gameId}`;
    navigator.clipboard.writeText(gameLink).then(() => {
      // Could add a toast notification here
    });
  };

  const copyGameCode = () => {
    navigator.clipboard.writeText(gameId).then(() => {
      // Could add a toast notification here
    });
  };

  useEffect(() => {
    // Auto-host when component mounts
    handleHostGame();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-800 to-green-600 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Creating Game...
          </h2>
          <p className="text-gray-600">Setting up your Euchre table</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-800 to-green-600 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={handleHostGame}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 to-green-600 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="text-green-500 text-4xl mb-4">✅</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Game Created!
          </h2>
          <p className="text-gray-600">Share this code with your friends</p>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <Input
              label="Game Code"
              value={gameId}
              readOnly
              variant="readonly"
              className="text-center font-mono text-lg"
              fullWidth
              copyButton
              onCopy={copyGameCode}
            />
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <Input
              label="Direct Link"
              value={
                typeof window !== "undefined"
                  ? `${window.location.origin}/join/${gameId}`
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

        <div className="mt-6">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
            <span>Connection Status:</span>
            <span
              className={`font-medium ${
                connectionStatus === "connected"
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

          <p className="text-sm text-gray-600 text-center">
            Redirecting to lobby in a moment...
          </p>
        </div>
      </div>
    </div>
  );
}
