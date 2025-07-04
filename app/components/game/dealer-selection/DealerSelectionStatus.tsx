interface DealerSelectionStatusProps {
  method: 'first_black_jack' | 'random_cards';
  dealerFound: boolean;
  currentStep: number;
  totalSteps: number;
  currentPlayerName?: string;
}

export default function DealerSelectionStatus({
  method,
  dealerFound,
  currentStep,
  totalSteps,
  currentPlayerName,
}: DealerSelectionStatusProps) {
  const getStatusText = () => {
    if (dealerFound) return 'Dealer found!';
    if (currentStep < 0) return 'Preparing to deal...';
    if (currentStep >= totalSteps) return 'Complete!';

    if (method === 'first_black_jack') {
      return 'Dealing cards until first black jack...';
    } else {
      return 'Dealing one card to each player...';
    }
  };

  return (
    <div className='absolute bottom-32 left-1/2 transform -translate-x-1/2 text-white text-center'>
      <div className='bg-black/70 backdrop-blur-sm px-6 py-3 rounded-lg shadow-lg border border-white/20'>
        <div className='text-lg font-medium mb-1'>
          {method === 'first_black_jack'
            ? 'Finding Dealer'
            : 'Selecting Dealer'}
        </div>
        <div className='text-sm text-gray-300'>
          {getStatusText()}
          {currentPlayerName &&
            currentStep >= 0 &&
            currentStep < totalSteps && (
              <div className='mt-1'>
                Card {currentStep + 1} • {currentPlayerName}&apos;s turn
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
