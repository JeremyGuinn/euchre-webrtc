import { CurrentTurnIndicator } from '~/components/game/indicators/CurrentTurnIndicator';
import { PlayerPosition } from '~/components/game/PlayerPosition';
import { TrickCenter } from '~/components/game/TrickCenter';
import type { Card as CardType, GameState, Player } from '~/types/game';

interface GameTableProps {
  gameState: GameState;
  myPlayer: Player;
  myHand: CardType[];
  currentPlayer: Player | undefined;
  headerHeight: number;
  shouldShowCards: boolean;
  isSittingOut: () => boolean;
  canPlay: (card: CardType) => boolean;
  isMyTurn: () => boolean;
  onCardClick: (card: CardType) => void;
  onDealerDiscard: (card: CardType) => void;
}

export function GameTable({
  gameState,
  myPlayer,
  myHand,
  currentPlayer,
  headerHeight,
  shouldShowCards,
  isSittingOut,
  canPlay,
  isMyTurn,
  onCardClick,
  onDealerDiscard,
}: GameTableProps) {
  const getPlayerPosition = (player: Player, myPosition: number) => {
    const relativePosition = (player.position - myPosition + 4) % 4;
    switch (relativePosition) {
      case 0:
        return 'bottom';
      case 1:
        return 'left';
      case 2:
        return 'top';
      case 3:
        return 'right';
      default:
        return 'bottom';
    }
  };

  return (
    <div
      className='relative w-full'
      style={{
        height: `calc(100vh - ${headerHeight}px)`,
        top: `${headerHeight}px`,
      }}
    >
      {/* Center area for tricks */}
      <TrickCenter
        gameState={gameState}
        myPlayer={myPlayer}
        getPlayerPosition={getPlayerPosition}
      />

      {/* Players around the table */}
      {gameState.players.map(player => {
        const position = getPlayerPosition(player, myPlayer.position);
        const isCurrentPlayer = player.id === gameState.currentPlayerId;

        // Check if this player is sitting out due to going alone
        const isPlayerSittingOut =
          gameState.maker?.alone &&
          gameState.maker.playerId !== player.id &&
          gameState.players.find(p => p.id === gameState.maker!.playerId)?.teamId === player.teamId;

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
            onCardClick={onCardClick}
            onDealerDiscard={onDealerDiscard}
            shouldShowCards={shouldShowCards}
          />
        );
      })}

      {/* Current turn indicator */}
      <CurrentTurnIndicator
        gameState={gameState}
        myPlayer={myPlayer}
        currentPlayer={currentPlayer}
      />
    </div>
  );
}
