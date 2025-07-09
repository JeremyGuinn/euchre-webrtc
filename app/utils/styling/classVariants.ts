import { cn } from './cn';

/**
 * Common text class combinations
 */
export const textVariants = {
  heading: cn('text-3xl font-bold text-gray-800 mb-4'),
  subheading: cn('text-xl font-semibold text-gray-700 mb-3'),
  body: cn('text-gray-600 mb-4'),
  caption: cn('text-sm text-gray-600'),
  error: cn('text-sm text-red-600'),
  success: cn('text-sm text-green-600'),
};

/**
 * Common layout class combinations
 */
export const layoutVariants = {
  centerScreen: cn('min-h-screen flex items-center justify-center p-4'),
  container: cn('max-w-lg w-full'),
  flexColumn: cn('flex flex-col space-y-4'),
  flexRow: cn('flex flex-row space-x-4'),
};

/**
 * Common development/debug class combinations
 */
export const debugVariants = {
  details: cn('mt-4 p-4 bg-gray-50 rounded-lg text-left'),
  summary: cn('cursor-pointer font-medium text-gray-700 mb-2'),
  codeBlock: cn('mt-1 text-xs overflow-auto bg-gray-100 p-2 rounded'),
  errorInfo: cn('text-sm text-gray-600 space-y-2'),
};
