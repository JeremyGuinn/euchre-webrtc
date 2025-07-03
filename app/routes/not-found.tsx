import { Link } from "react-router";
import LinkButton from "../components/ui/LinkButton";
import ButtonDivider from "../components/ui/ButtonDivider";
import PageContainer from "../components/layout/PageContainer";

export function meta() {
  return [
    { title: "Page Not Found - Euchre Online" },
    { name: "description", content: "The page you're looking for doesn't exist" },
  ];
}

export default function NotFound() {
  return (
    <PageContainer className="text-center">
      {/* Card symbols decoration */}
      <div className="text-6xl mb-6 space-x-2">
        <span className="text-black animate-bounce">♠️</span>
        <span className="text-red-600 animate-bounce" style={{ animationDelay: '0.1s' }}>♥️</span>
        <span className="text-red-600 animate-bounce" style={{ animationDelay: '0.2s' }}>♦️</span>
        <span className="text-black animate-bounce" style={{ animationDelay: '0.3s' }}>♣️</span>
      </div>

      {/* Error message */}
      <div className="mb-8">
        <h1 className="text-6xl font-bold text-gray-800 mb-4 animate-pulse">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          Page Not Found
        </h2>
        <p className="text-gray-600 mb-2">
          Looks like you've played your hand wrong!
        </p>
        <p className="text-gray-600">
          The page you're looking for doesn't exist.
        </p>
      </div>

      {/* Action buttons */}
      <div className="space-y-4">
        <LinkButton
          to="/"
          variant="primary"
        >
          🏠 Go Home
        </LinkButton>

        <ButtonDivider />

        <LinkButton
          to="/host"
          variant="success"
        >
          🎮 Host a New Game
        </LinkButton>
      </div>

      {/* Fun euchre-themed message */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg border-l-4 border-green-500">
        <p className="text-sm text-gray-600 italic">
          "In Euchre, sometimes you have to go alone.
          But you don't have to navigate this website alone!"
        </p>
      </div>

      {/* Footer info */}
      <div className="mt-6 text-center">
        <div className="text-xs text-gray-500 space-y-1">
          <p>🔒 No registration required</p>
          <p>🌐 Peer-to-peer connection</p>
          <p>👥 4 players needed</p>
        </div>
      </div>
    </PageContainer>
  );
}
