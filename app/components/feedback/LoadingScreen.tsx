import { Center } from '../ui/Center';
import { Spinner } from '../ui/Spinner';
import { Stack } from '../ui/Stack';
interface LoadingScreenProps {
  title: string;
  message: string;
  className?: string;
}

export default function LoadingScreen({
  title,
  message,
  className = '',
}: LoadingScreenProps) {
  return (
    <Center className={`text-center ${className}`}>
      <Stack spacing='2'>
        <Center>
          <Spinner size='lg' />
        </Center>
        <h2 className='text-xl font-semibold text-gray-800'>{title}</h2>
        <p className='text-gray-600'>{message}</p>
      </Stack>
    </Center>
  );
}
