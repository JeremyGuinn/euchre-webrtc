import type { Route } from "./+types/join";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useGame } from "../contexts/GameContext";
import { useIsClient } from "../hooks/useClientOnly";
import { isValidGameCode, normalizeGameCode } from "../utils/gameCode";
import Button from "../components/ui/Button";
import LinkButton from "../components/ui/LinkButton";
import Input from "../components/ui/Input";
import PageContainer from "../components/layout/PageContainer";
import ErrorDisplay from "../components/ui/ErrorDisplay";
import ConnectionStatusDisplay from "../components/ui/ConnectionStatusDisplay";

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: `Join Game ${params.gameId} - Euchre Online` },
    { name: "description", content: "Join a Euchre game with friends" },
  ];
}

export default function Join({ params }: Route.ComponentProps) {
  const navigate = useNavigate();
  const isClientSide = useIsClient();
  const { joinGame, connectionStatus } = useGame();
  const gameId = normalizeGameCode(params.gameId || "");

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

  // Handle connection status changes
  useEffect(() => {
    // If we successfully connect, navigate to lobby
    if (connectionStatus === "connected") {
      navigate(`/lobby/${gameId}`);
    }
    // If connection fails or errors out, show error
    if (connectionStatus === "error") {
      setError("Connection failed. Please try again.");
      setIsJoining(false);
    }
  }, [connectionStatus, navigate, gameId]);

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

      // Navigation to lobby will be handled by the useEffect watching connectionStatus
    } catch (err) {
      console.error("Failed to join game:", err);
      setError("Failed to join game. Please check the game code and try again.");
      setIsJoining(false);
    }
  };

  return (
    <PageContainer>
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

        {error && <ErrorDisplay error={error} />}

        <ConnectionStatusDisplay status={connectionStatus} className="justify-between mb-4" />

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
    </PageContainer>
  );
}
