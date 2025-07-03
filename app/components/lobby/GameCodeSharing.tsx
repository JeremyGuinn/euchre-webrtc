import React from "react";
import Input from "../ui/Input";
import { useIsClient } from "../../hooks/useClientOnly";

interface GameCodeSharingProps {
  gameId: string;
  className?: string;
  layout?: "horizontal" | "vertical";
}

export default function GameCodeSharing({ 
  gameId, 
  className = "",
  layout = "vertical"
}: GameCodeSharingProps) {
  const isClientSide = useIsClient();

  const copyGameCode = () => {
    if (isClientSide && typeof navigator !== "undefined") {
      navigator.clipboard.writeText(gameId);
    }
  };

  const copyGameLink = () => {
    if (isClientSide && typeof window !== "undefined") {
      const gameLink = `${window.location.origin}${window.__reactRouterContext?.basename || ""}join/${gameId}`;
      navigator.clipboard.writeText(gameLink);
    }
  };

  const getGameLink = () => {
    if (isClientSide && typeof window !== "undefined") {
      return `${window.location.origin}${window.__reactRouterContext?.basename || ""}join/${gameId}`;
    }
    return "";
  };

  const containerClass = layout === "horizontal" 
    ? "grid grid-cols-1 md:grid-cols-2 gap-4" 
    : "space-y-4";

  return (
    <div className={`${containerClass} ${className}`}>
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
          label={layout === "horizontal" ? "Invite Link" : "Direct Link"}
          value={getGameLink()}
          readOnly
          variant="readonly"
          className="text-sm"
          fullWidth
          copyButton
          onCopy={copyGameLink}
        />
      </div>
    </div>
  );
}
