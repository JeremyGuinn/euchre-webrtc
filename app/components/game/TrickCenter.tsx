import { Card, CardBack } from '~/components/game/Card';
import { Center } from '~/components/ui/Center';
import type { GameState, Player } from '~/types/game';

interface TrickCenterProps {
  gameState: GameState;
  myPlayer: Player;
  getPlayerPosition: (player: Player, myPosition: number) => string;
}

export function TrickCenter({ gameState, myPlayer, getPlayerPosition }: TrickCenterProps) {
  return (
    <Center className='absolute inset-0'>
      <div className='w-64 h-64 bg-green-700 rounded-full border-4 border-yellow-600 relative'>
        {/* Current trick cards */}
        {gameState.currentTrick &&
          gameState.currentTrick.cards.map(playedCard => {
            const player = gameState.players.find(p => p.id === playedCard.playerId);
            if (!player) return null;

            // Get the relative position of the player who played this card
            const playerPosition = getPlayerPosition(player, myPlayer.position);

            // Map player position to angle for card placement
            let angle;
            switch (playerPosition) {
              case 'bottom':
                angle = 180;
                break; // 6 o'clock
              case 'left':
                angle = 270;
                break; // 9 o'clock
              case 'top':
                angle = 0;
                break; // 12 o'clock
              case 'right':
                angle = 90;
                break; // 3 o'clock
              default:
                angle = 180;
            }

            const radius = 80;
            const x = Math.cos(((angle - 90) * Math.PI) / 180) * radius; // -90 to adjust for 0° being top
            const y = Math.sin(((angle - 90) * Math.PI) / 180) * radius;

            return (
              <div
                key={playedCard.card.id}
                className='absolute transform -translate-x-1/2 -translate-y-1/2 z-20'
                style={{
                  left: `calc(50% + ${x}px)`,
                  top: `calc(50% + ${y}px)`,
                }}
              >
                <Card card={playedCard.card} size='medium' />
              </div>
            );
          })}

        {/* Kitty card (during bidding) */}
        {(gameState.phase === 'bidding_round1' || gameState.phase === 'bidding_round2') &&
          gameState.kitty && (
            <div className='relative h-full'>
              <div className='absolute flex items-center transform justify-self-center -translate-y-1/2 top-1/2'>
                <div className='relative'>
                  <CardBack size='medium' className='absolute top-0 left-0 opacity-60' />
                  <CardBack size='medium' className='absolute top-0.5 left-0.5 opacity-80' />
                  <CardBack size='medium' className='absolute top-1 left-1' />

                  {(gameState.phase === 'bidding_round1' && (
                    <div className='flex justify-center' id='kitty-card'>
                      <Card card={gameState.kitty} size='medium' className='relative z-10' />
                    </div>
                  )) || <CardBack size='medium' className='relative z-10' />}
                </div>
              </div>
            </div>
          )}
      </div>
    </Center>
  );
}
