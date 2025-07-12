import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { PlayerHand } from '~/components/game/PlayerHand';
import { PlayerManagementMenu } from '~/components/game/PlayerManagementMenu';
import { gameStore } from '~/store/gameStore';
import type { Card as CardType, Player, Position } from '~/types/game';
import { getPositionClasses } from '~/utils/game/playerPositionUtils';

interface PlayerPositionProps {
  player: Player;
  myPlayer: Player;
  myHand: CardType[];
  position: Position;
  isCurrentPlayer: boolean;
  isPlayerSittingOut: boolean;
  isSittingOut: boolean;
  canPlay: (card: CardType) => boolean;
  isMyTurn: () => boolean;
  onCardClick: (card: CardType) => void;
  onDealerDiscard: (card: CardType) => void;
  onReorderHand: (newOrder: CardType[]) => void;
  shouldShowCards: boolean;
  isHost?: boolean;
  onKickPlayer?: (playerId: string) => void;
}

export function PlayerPosition({
  player,
  myPlayer,
  myHand,
  position,
  isCurrentPlayer,
  isPlayerSittingOut,
  isSittingOut,
  canPlay,
  isMyTurn,
  onCardClick,
  onDealerDiscard,
  onReorderHand,
  shouldShowCards,
  isHost,
  onKickPlayer,
}: PlayerPositionProps) {
  const phase = gameStore.use.phase();
  const currentDealerPosition = gameStore.use.currentDealerPosition();

  const [showManagementMenu, setShowManagementMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLButtonElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowManagementMenu(false);
      }
    };

    if (showManagementMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showManagementMenu]);

  const calculateMenuPosition = () => {
    if (!nameRef.current) return { top: 0, left: 0 };

    const buttonRect = nameRef.current.getBoundingClientRect();
    const menuWidth = 200; // Approximate menu width
    const menuHeight = 150; // Approximate menu height
    const margin = 8;

    let top = buttonRect.bottom + margin;
    let left = buttonRect.left + buttonRect.width / 2 - menuWidth / 2;

    // Adjust if menu would go off screen
    if (left < margin) {
      left = margin;
    } else if (left + menuWidth > window.innerWidth - margin) {
      left = window.innerWidth - menuWidth - margin;
    }

    if (top + menuHeight > window.innerHeight - margin) {
      top = buttonRect.top - menuHeight - margin;
    }

    return { top, left };
  };

  const handlePlayerNameClick = () => {
    // Only show menu for host and for other players (not yourself)
    if (isHost && player.id !== myPlayer.id && onKickPlayer) {
      const position = calculateMenuPosition();
      setMenuPosition(position);
      setShowManagementMenu(true);
    }
  };

  const handleCloseMenu = () => {
    setShowManagementMenu(false);
  };

  return (
    <div className={getPositionClasses(position)}>
      <div
        className={`text-center flex gap-2 items-center ${position === 'top' ? 'flex-col-reverse ' : 'flex-col'}`}
      >
        {phase !== 'dealing_animation' && phase !== 'dealer_selection' && (
          <div className='relative'>
            {isHost && player.id !== myPlayer.id && onKickPlayer ? (
              <button
                ref={nameRef}
                className={`inline-block text-nowrap px-3 py-1 rounded-lg text-sm font-medium w-fit cursor-pointer hover:opacity-80 transition-opacity ${
                  isPlayerSittingOut
                    ? 'bg-gray-500 text-gray-300'
                    : isCurrentPlayer
                      ? 'bg-yellow-400 text-black'
                      : 'bg-white/20 text-white'
                }${!player.isConnected ? ' opacity-50' : ''}`}
                onClick={handlePlayerNameClick}
                title='Click to manage player'
              >
                {player.name} {player.id === myPlayer.id && '(You)'}
                {!player.isConnected && ' (Disconnected)'}
                {currentDealerPosition === player.position && ' (Dealer)'}
                {isPlayerSittingOut && ' (Sitting Out)'}
              </button>
            ) : (
              <div
                className={`inline-block text-nowrap px-3 py-1 rounded-lg text-sm font-medium w-fit ${
                  isPlayerSittingOut
                    ? 'bg-gray-500 text-gray-300'
                    : isCurrentPlayer
                      ? 'bg-yellow-400 text-black'
                      : 'bg-white/20 text-white'
                }${!player.isConnected ? ' opacity-50' : ''}`}
              >
                {player.name} {player.id === myPlayer.id && '(You)'}
                {!player.isConnected && ' (Disconnected)'}
                {currentDealerPosition === player.position && ' (Dealer)'}
                {isPlayerSittingOut && ' (Sitting Out)'}
              </div>
            )}

            {/* Player Management Menu */}
            {showManagementMenu &&
              onKickPlayer &&
              createPortal(
                <div
                  ref={menuRef}
                  className='fixed z-50'
                  style={{
                    top: `${menuPosition.top}px`,
                    left: `${menuPosition.left}px`,
                  }}
                >
                  <PlayerManagementMenu
                    player={player}
                    isMyPlayer={player.id === myPlayer.id}
                    isHost={isHost || false}
                    onKickPlayer={onKickPlayer}
                    onClose={handleCloseMenu}
                  />
                </div>,
                document.body
              )}
          </div>
        )}

        {/* Player's cards */}
        <PlayerHand
          player={player}
          myPlayer={myPlayer}
          myHand={myHand}
          isSittingOut={isSittingOut}
          canPlay={canPlay}
          isMyTurn={isMyTurn}
          onCardClick={onCardClick}
          onDealerDiscard={onDealerDiscard}
          onReorderHand={onReorderHand}
          shouldShowCards={shouldShowCards}
        />
      </div>
    </div>
  );
}
