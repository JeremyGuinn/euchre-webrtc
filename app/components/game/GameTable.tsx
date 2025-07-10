import { CurrentTurnIndicator } from '~/components/game/indicators/CurrentTurnIndicator';
import { PlayerPosition } from '~/components/game/PlayerPosition';
import { TrickCenter } from '~/components/game/TrickCenter';
import { useGame } from '~/contexts/GameContext';
import { useGameUI } from '~/hooks/useGameUI';

interface GameTableProps {
  headerHeight: number;
  shouldShowCards: boolean;
}

export function GameTable({ headerHeight, shouldShowCards }: GameTableProps) {
  const {
    gameState,
    myPlayer,
    isHost,
    getPlayerPosition,
    getMyHand,
    canPlay,
    isMyTurn,
    isSittingOut,
    handlePlayCard,
    handleDealerDiscard,
  } = useGameUI();

  const { kickPlayer } = useGame();

  if (!myPlayer) {
    return null;
  }

  const myHand = getMyHand();

  return (
    <div
      className='relative w-full'
      style={{
        height: `calc(100vh - ${headerHeight}px)`,
        top: `${headerHeight}px`,
      }}
    >
      {/* Center area for tricks */}
      <TrickCenter />

      {/* Players around the table */}
      {gameState.players.map(player => {
        const position = getPlayerPosition(player);
        const isCurrentPlayer = player.position === gameState.currentPlayerPosition;

        // Check if this player is sitting out due to going alone
        const isPlayerSittingOut =
          gameState.maker?.alone &&
          gameState.maker.playerPosition !== player.position &&
          gameState.players.find(p => p.position === gameState.maker!.playerPosition)?.teamId ===
            player.teamId;

        return (
          <PlayerPosition
            key={player.id}
            player={player}
            myPlayer={myPlayer}
            myHand={myHand}
            gameState={gameState}
            position={position}
            isCurrentPlayer={isCurrentPlayer}
            isPlayerSittingOut={isPlayerSittingOut || false}
            isSittingOut={isSittingOut}
            canPlay={canPlay}
            isMyTurn={isMyTurn}
            onCardClick={handlePlayCard}
            onDealerDiscard={handleDealerDiscard}
            shouldShowCards={shouldShowCards}
            isHost={isHost}
            onKickPlayer={() => kickPlayer(player.id)}
          />
        );
      })}

      {/* Current turn indicator */}
      <CurrentTurnIndicator />
    </div>
  );
}
