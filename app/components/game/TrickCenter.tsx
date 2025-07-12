import { useCallback } from 'react';
import { Card, CardBack } from '~/components/game/Card';
import { Center } from '~/components/ui/Center';
import { gameStore } from '~/store/gameStore';
import { select } from '~/store/selectors/players';
import type { Player } from '~/types/game';
import {
  getCircularPosition,
  getPositionAngle,
  getRelativePlayerPosition,
} from '~/utils/game/playerPositionUtils';

export function TrickCenter() {
  const currentTrick = gameStore.use.currentTrick();
  const kitty = gameStore.use.kitty();
  const phase = gameStore.use.phase();
  const players = gameStore.use.players();
  const myPlayer = gameStore(select.myPlayer);

  const getPlayerCircularPosition = useCallback(
    (player: Player, radius: number) => {
      if (!myPlayer) return { x: 0, y: 0 };

      const relativePosition = getRelativePlayerPosition(player, myPlayer.position);
      const angle = getPositionAngle(relativePosition);
      return getCircularPosition(angle, radius);
    },
    [myPlayer]
  );

  if (!myPlayer) {
    return null;
  }
  return (
    <Center className='absolute inset-0'>
      <div className='w-64 h-64 bg-green-700 rounded-full border-4 border-yellow-600 relative'>
        {/* Current trick cards */}
        {currentTrick &&
          currentTrick.cards.map(playedCard => {
            const player = players.find(p => p.position === playedCard.playerPosition);
            if (!player) return null;

            // Get circular position coordinates for the player who played this card
            const radius = 80;
            const { x, y } = getPlayerCircularPosition(player, radius);

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
        {(phase === 'bidding_round1' || phase === 'bidding_round2') && kitty && (
          <div className='relative h-full'>
            <div className='absolute flex items-center transform justify-self-center -translate-y-1/2 top-1/2'>
              <div className='relative'>
                <CardBack size='medium' className='absolute top-0 left-0 opacity-60' />
                <CardBack size='medium' className='absolute top-0.5 left-0.5 opacity-80' />
                <CardBack size='medium' className='absolute top-1 left-1' />

                {(phase === 'bidding_round1' && (
                  <div className='flex justify-center' id='kitty-card'>
                    <Card card={kitty} size='medium' className='relative z-10' />
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
