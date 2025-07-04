import { cn } from './cn';

/**
 * Common button class combinations
 */
export const buttonVariants = {
    primary: cn(
        'w-full font-semibold py-3 px-6 rounded-lg',
        'transition-colors duration-200',
        'bg-blue-600 hover:bg-blue-700 text-white'
    ),
    secondary: cn(
        'w-full font-semibold py-3 px-6 rounded-lg',
        'transition-colors duration-200',
        'bg-gray-600 hover:bg-gray-700 text-white'
    ),
    success: cn(
        'w-full font-semibold py-3 px-6 rounded-lg',
        'transition-colors duration-200',
        'bg-green-600 hover:bg-green-700 text-white'
    ),
    danger: cn(
        'w-full font-semibold py-3 px-6 rounded-lg',
        'transition-colors duration-200',
        'bg-red-600 hover:bg-red-700 text-white'
    ),
};

/**
 * Common card/container class combinations
 */
export const cardVariants = {
    default: cn('bg-white rounded-lg shadow-lg p-8'),
    compact: cn('bg-white rounded-lg shadow-md p-4'),
    large: cn('bg-white rounded-xl shadow-xl p-12'),
};

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
    centerScreen: cn(
        'min-h-screen flex items-center justify-center p-4'
    ),
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
