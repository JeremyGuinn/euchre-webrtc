import { useGameStore } from '~/store/gameStore';

interface DealerSelectionStatusProps {
  dealerFound: boolean;
  currentStep: number;
  totalSteps: number;
}

export default function DealerSelectionStatus({
  dealerFound,
  currentStep,
  totalSteps,
}: DealerSelectionStatusProps) {
  const {
    options: { dealerSelection },
  } = useGameStore();

  const getStatusText = () => {
    if (dealerFound) return 'Dealer found!';
    if (currentStep < 0) return 'Preparing to deal...';
    if (currentStep >= totalSteps) return 'Complete!';

    if (dealerSelection === 'first_black_jack') {
      return 'Dealing cards until first black jack...';
    } else {
      return 'Waiting for each player to pick a card...';
    }
  };

  return (
    <div className='absolute bottom-32 left-1/2 transform -translate-x-1/2 text-white text-center'>
      <div className='bg-black/70 backdrop-blur-sm px-6 py-3 rounded-lg shadow-lg border border-white/20'>
        <div className='text-lg font-medium mb-1'>
          {dealerSelection === 'first_black_jack' ? 'Finding Dealer' : 'Selecting Dealer'}
        </div>
        <div className='text-sm text-gray-300'>{getStatusText()}</div>
      </div>
    </div>
  );
}
