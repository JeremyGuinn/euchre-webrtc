import type { Route } from "./+types/home";
import { useLocation } from "react-router";
import { useState, useEffect } from "react";
import { isValidGameCode, normalizeGameCode } from "../utils/gameCode";
import LinkButton from "../components/ui/LinkButton";
import ButtonDivider from "../components/ui/ButtonDivider";
import Input from "../components/ui/Input";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Euchre Online - Play with Friends" },
    { name: "description", content: "Play Euchre online with friends using peer-to-peer connections. No servers, no registration required!" },
  ];
}

export default function Home() {
  const [gameCode, setGameCode] = useState("");
  const location = useLocation();
  const [kickMessage, setKickMessage] = useState<string | null>(null);

  // Check for kick message from navigation state
  useEffect(() => {
    if (location.state && location.state.kickMessage) {
      setKickMessage(location.state.kickMessage);
      // Clear the message after 5 seconds
      const timer = setTimeout(() => {
        setKickMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 to-green-600 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {/* Kick Message Alert */}
        {kickMessage && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-red-400">⚠️</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{kickMessage}</p>
              </div>
            </div>
          </div>
        )}

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">♠️ Euchre Online ♥️</h1>
          <p className="text-gray-600">Play the classic card game with friends</p>
        </div>

        <div className="space-y-4">
          <LinkButton
            to="/host"
            variant="primary"
          >
            Host a New Game
          </LinkButton>

          <ButtonDivider />

          <div className="space-y-2">
            <Input
              placeholder="Enter game code (e.g., A3K7M2)"
              value={gameCode}
              onChange={(e) => {
                const normalized = normalizeGameCode(e.target.value);
                setGameCode(normalized);
              }}
              className="font-mono text-center"
              maxLength={6}
              fullWidth
            />
            <LinkButton
              to={isValidGameCode(gameCode) ? `/join/${gameCode}` : "#"}
              variant="success"
              disabled={!isValidGameCode(gameCode)}
              onClick={(e) => {
                if (!gameCode) {
                  e.preventDefault();
                }
              }}
            >
              Join Game
            </LinkButton>
          </div>
        </div>

        <div className="mt-8 text-center">
          <div className="text-sm text-gray-600 space-y-1">
            <p>🔒 No registration required</p>
            <p>🌐 Peer-to-peer connection</p>
            <p>👥 4 players needed</p>
          </div>
        </div>
      </div>
    </div>
  );
}
