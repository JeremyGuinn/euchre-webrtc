import { useId, useState, type ReactNode } from 'react';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
  fullWidth?: boolean;
  variant?: 'default' | 'readonly' | 'search';
  copyButton?: boolean;
  onCopy?: () => void;
}

export function Input({
  label,
  error,
  hint,
  icon,
  fullWidth = false,
  variant = 'default',
  className = '',
  copyButton = false,
  onCopy,
  ...props
}: InputProps) {
  const baseClasses =
    'px-3 py-2 border rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0';

  const variantClasses = {
    default:
      'border-gray-300 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900',
    readonly: 'border-gray-300 bg-gray-50 text-gray-700 cursor-default',
    search:
      'border-gray-300 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 pl-10',
  };

  const errorClasses = error
    ? 'border-red-300 focus:ring-red-500 focus:border-transparent'
    : variantClasses[variant];

  const inputClasses = [
    baseClasses,
    errorClasses,
    fullWidth ? 'w-full' : '',
    copyButton ? 'pr-10' : '', // Add padding for copy button
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const generatedId = useId();
  const inputId = props.id || generatedId;
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (onCopy) {
      onCopy();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    }
  };

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label
          htmlFor={inputId}
          className='block text-sm font-medium text-gray-700 mb-2'
        >
          {label}
        </label>
      )}

      <div className='relative'>
        {icon && variant === 'search' && (
          <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
            <div className='text-gray-400'>{icon}</div>
          </div>
        )}

        <input
          {...props}
          id={inputId}
          className={inputClasses}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
          }
          onClick={() => {
            if (copyButton) {
              handleCopy();
            }
          }}
          onKeyDown={e => {
            if (e.key === 'Enter' && copyButton) {
              e.preventDefault(); // Prevent form submission
              handleCopy();
            }
          }}
        />

        {copyButton && onCopy && (
          <button
            type='button'
            onClick={handleCopy}
            className={`absolute inset-y-0 right-0 pr-3 flex items-center transition-colors cursor-pointer ${
              copied
                ? 'text-green-600 hover:text-green-700'
                : 'text-gray-400 hover:text-gray-600'
            }`}
            title={copied ? 'Copied!' : 'Copy to clipboard'}
          >
            {copied ? (
              <svg
                className='w-4 h-4'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M5 13l4 4L19 7'
                />
              </svg>
            ) : (
              <svg
                className='w-4 h-4'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z'
                />
              </svg>
            )}
          </button>
        )}

        {icon && variant !== 'search' && !copyButton && (
          <div className='absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none'>
            <div className='text-gray-400'>{icon}</div>
          </div>
        )}
      </div>

      {error && (
        <p id={`${inputId}-error`} className='mt-1 text-sm text-red-600'>
          {error}
        </p>
      )}

      {hint && !error && (
        <p id={`${inputId}-hint`} className='mt-1 text-sm text-gray-500'>
          {hint}
        </p>
      )}
    </div>
  );
}

export default Input;
