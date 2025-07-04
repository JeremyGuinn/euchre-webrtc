import Button from '~/components/ui/Button';
import type { Card as CardType } from '~/types/game';

interface BiddingInterfaceProps {
  phase: 'bidding_round1' | 'bidding_round2';
  kitty?: CardType;
  turnedDownSuit?: CardType['suit'];
  suitSymbols: Record<string, string>;
  suitColors: Record<string, string>;
  onBid: (suit: CardType['suit'] | 'pass', alone?: boolean) => void;
}

const SUITS: CardType['suit'][] = ['spades', 'hearts', 'diamonds', 'clubs'];

export function BiddingInterface({
  phase,
  kitty,
  turnedDownSuit,
  suitSymbols,
  suitColors,
  onBid,
}: BiddingInterfaceProps) {
  const handleBid = (suit: CardType['suit'] | 'pass', alone = false) => {
    onBid(suit, alone);
  };

  return (
    <div className='absolute bottom-24 left-1/2 transform -translate-x-1/2 z-30'>
      <div className='bg-white/95 backdrop-blur-sm rounded-lg shadow-xl p-3 border border-gray-200 max-w-xs'>
        <div className='text-center'>
          <h3 className='text-sm font-bold text-gray-800 mb-2'>
            {phase === 'bidding_round1' ? 'Order It Up?' : 'Call Trump?'}
          </h3>

          {phase === 'bidding_round1' && kitty && (
            <div className='text-xs text-gray-600 mb-3'>
              Kitty card:{' '}
              <span className={`font-medium ${suitColors[kitty.suit]}`}>
                {suitSymbols[kitty.suit]} {kitty.value}
              </span>
            </div>
          )}

          {phase === 'bidding_round1' ? (
            /* Round 1: Order up the kitty or pass */
            <div className='space-y-2'>
              <Button
                variant='primary'
                size='sm'
                onClick={() => handleBid(kitty!.suit)}
                className='w-full px-3 py-1 text-xs'
              >
                Order It Up ({suitSymbols[kitty!.suit]} {kitty!.suit})
              </Button>
              <div className='flex space-x-1'>
                <Button
                  variant='primary'
                  size='sm'
                  onClick={() => handleBid(kitty!.suit, true)}
                  className='flex-1 px-2 py-1 text-xs'
                >
                  Alone
                </Button>
                <Button
                  variant='secondary'
                  size='sm'
                  onClick={() => handleBid('pass')}
                  className='flex-1 px-2 py-1 text-xs'
                >
                  Pass
                </Button>
              </div>
            </div>
          ) : (
            /* Round 2: Call any suit except kitty suit */
            <div className='space-y-2'>
              {turnedDownSuit && (
                <div className='mb-2'>
                  <p className='text-xs text-gray-600'>
                    Turned down:{' '}
                    <span
                      className={`font-medium ${suitColors[turnedDownSuit]}`}
                    >
                      {suitSymbols[turnedDownSuit]} {turnedDownSuit}
                    </span>
                  </p>
                </div>
              )}

              <div className='grid grid-cols-2 gap-1'>
                {SUITS.filter(
                  suit => suit !== (turnedDownSuit || kitty?.suit)
                ).map(suit => (
                  <Button
                    key={suit}
                    variant='primary'
                    size='sm'
                    onClick={() => handleBid(suit)}
                    className='flex flex-col items-center justify-center px-2 py-1 text-xs h-12'
                  >
                    <span className={`text-sm ${suitColors[suit]}`}>
                      {suitSymbols[suit]}
                    </span>
                    <span className='text-xs capitalize'>{suit}</span>
                  </Button>
                ))}
              </div>

              <div className='flex space-x-1 mt-2'>
                {SUITS.filter(
                  suit => suit !== (turnedDownSuit || kitty?.suit)
                ).map(suit => (
                  <Button
                    key={`${suit}-alone`}
                    variant='success'
                    size='sm'
                    onClick={() => handleBid(suit, true)}
                    className='flex-1 px-1 py-1 text-xs'
                    title={`Call ${suit} and go alone`}
                  >
                    <span className={suitColors[suit]}>
                      {suitSymbols[suit]}
                    </span>
                    A
                  </Button>
                ))}
              </div>

              <Button
                variant='secondary'
                size='sm'
                onClick={() => handleBid('pass')}
                className='w-full px-3 py-1 text-xs'
              >
                Pass
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
