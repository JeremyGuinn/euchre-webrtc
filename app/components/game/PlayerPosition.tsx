import { PlayerHand } from '~/components/game/PlayerHand';
import type { Card as CardType, GameState, Player } from '~/types/game';

interface PlayerPositionProps {
  player: Player;
  myPlayer: Player;
  myHand: CardType[];
  gameState: GameState;
  position: string;
  isCurrentPlayer: boolean;
  isPlayerSittingOut: boolean;
  isSittingOut: () => boolean;
  canPlay: (card: CardType) => boolean;
  isMyTurn: () => boolean;
  onCardClick: (card: CardType) => void;
  onDealerDiscard: (card: CardType) => void;
  shouldShowCards: boolean;
}

export function PlayerPosition({
  player,
  myPlayer,
  myHand,
  gameState,
  position,
  isCurrentPlayer,
  isPlayerSittingOut,
  isSittingOut,
  canPlay,
  isMyTurn,
  onCardClick,
  onDealerDiscard,
  shouldShowCards,
}: PlayerPositionProps) {
  const getPositionClasses = (position: string) => {
    switch (position) {
      case 'bottom':
        return 'absolute bottom-2 left-1/2 transform -translate-x-1/2';
      case 'left':
        return 'absolute left-14 top-1/2 transform -translate-y-1/2 rotate-90 -translate-x-1/2';
      case 'top':
        return 'absolute top-14 left-1/2 transform -translate-x-1/2 -translate-y-1/2';
      case 'right':
        return 'absolute right-14 top-1/2 transform -translate-y-1/2 -rotate-90 translate-x-1/2';
      default:
        return '';
    }
  };

  return (
    <div className={getPositionClasses(position)}>
      <div
        className={`text-center flex gap-2 items-center ${position === 'top' ? 'flex-col-reverse ' : 'flex-col'}`}
      >
        {gameState.phase !== 'dealing_animation' && gameState.phase !== 'dealer_selection' && (
          <div
            className={`inline-block px-3 py-1 rounded-lg text-sm font-medium w-fit ${
              isPlayerSittingOut
                ? 'bg-gray-500 text-gray-300'
                : isCurrentPlayer
                  ? 'bg-yellow-400 text-black'
                  : 'bg-white/20 text-white'
            }${!player.isConnected ? 'opacity-50' : ''}
          `}
          >
            {player.name} {player.id === myPlayer.id && '(You)'}
            {!player.isConnected && ' (Disconnected)'}
            {gameState.currentDealerId === player.id && ' (Dealer)'}
            {isPlayerSittingOut && ' (Sitting Out)'}
          </div>
        )}

        {/* Player's cards */}
        <PlayerHand
          player={player}
          myPlayer={myPlayer}
          myHand={myHand}
          gameState={gameState}
          isSittingOut={isSittingOut}
          canPlay={canPlay}
          isMyTurn={isMyTurn}
          onCardClick={onCardClick}
          onDealerDiscard={onDealerDiscard}
          shouldShowCards={shouldShowCards}
        />
      </div>
    </div>
  );
}
