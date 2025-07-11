import { useCallback, useMemo } from 'react';
import { CurrentTurnIndicator } from '~/components/game/indicators/CurrentTurnIndicator';
import { PlayerPosition } from '~/components/game/PlayerPosition';
import { TrickCenter } from '~/components/game/TrickCenter';
import { useGame } from '~/contexts/GameContext';
import { useGameStore } from '~/store/gameStore';
import { select } from '~/store/selectors/players';
import type { Card } from '~/types/game';
import { getRelativePlayerPosition } from '~/utils/game/playerPositionUtils';

interface GameTableProps {
  headerHeight: number;
  shouldShowCards: boolean;
}

export function GameTable({ headerHeight, shouldShowCards }: GameTableProps) {
  const { kickPlayer, playCard, dealerDiscard } = useGame();
  const gameStore = useGameStore();
  const { players, currentPlayerPosition, maker, phase } = useGameStore();
  const myPlayer = useMemo(() => select.myPlayer(gameStore), [gameStore]);
  const myHand = useMemo(() => select.myHand(gameStore), [gameStore]);
  const canPlay = useCallback((card: Card) => select.canPlay(gameStore)(card), [gameStore]);
  const isSittingOut = useMemo(() => select.isSittingOut(gameStore), [gameStore]);

  if (!myPlayer) return null;

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
      {players.map(player => {
        const position = getRelativePlayerPosition(player, myPlayer.position);
        const isCurrentPlayer = player.position === currentPlayerPosition;

        // Check if this player is sitting out due to going alone
        const isPlayerSittingOut =
          maker?.alone &&
          maker.playerPosition !== player.position &&
          players.find(p => p.position === maker!.playerPosition)?.teamId === player.teamId;

        return (
          <PlayerPosition
            key={player.id}
            player={player}
            myPlayer={myPlayer}
            myHand={myHand || []}
            position={position}
            isCurrentPlayer={isCurrentPlayer}
            isPlayerSittingOut={isPlayerSittingOut || false}
            isSittingOut={isSittingOut}
            canPlay={canPlay}
            isMyTurn={() => player.position === currentPlayerPosition}
            onCardClick={playCard}
            onDealerDiscard={dealerDiscard}
            shouldShowCards={shouldShowCards}
            isHost={myPlayer?.isHost}
            onKickPlayer={() => kickPlayer(player.id)}
          />
        );
      })}

      {/* Current turn indicator */}
      {['dealing_animation', 'dealer_selection', 'team_summary'].includes(phase) && (
        <CurrentTurnIndicator />
      )}
    </div>
  );
}
