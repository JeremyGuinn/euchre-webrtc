import { useCallback, useEffect, useState } from 'react';

// Auto-advance configuration
const AUTO_ADVANCE_CONFIG = {
  TRICK_COMPLETE_DELAY_MS: 1500,
  PROGRESS_UPDATE_INTERVAL_MS: 100,
  get PROGRESS_STEPS() {
    return this.TRICK_COMPLETE_DELAY_MS / this.PROGRESS_UPDATE_INTERVAL_MS;
  },
  get PROGRESS_INCREMENT() {
    return 100 / this.PROGRESS_STEPS;
  },
} as const;

interface UseAutoAdvanceOptions {
  /** The delay in milliseconds before auto-advancing */
  delayMs?: number;
  /** The interval in milliseconds for progress updates */
  progressIntervalMs?: number;
  /** Whether auto-advance should be enabled */
  enabled?: boolean;
}

interface UseAutoAdvanceReturn {
  /** Current progress percentage (0-100) */
  progress: number;
  /** Whether auto-advance is currently active */
  isActive: boolean;
  /** Manually trigger the auto-advance action */
  trigger: () => void;
  /** Cancel the current auto-advance */
  cancel: () => void;
  /** Reset progress to 0 */
  reset: () => void;
}

/**
 * Custom hook for auto-advancing with progress tracking
 *
 * @param action - The function to execute when auto-advance completes
 * @param options - Configuration options for auto-advance behavior
 * @returns Object with progress state and control functions
 */
export function useAutoAdvance(
  action: () => void,
  options: UseAutoAdvanceOptions = {}
): UseAutoAdvanceReturn {
  const {
    delayMs = AUTO_ADVANCE_CONFIG.TRICK_COMPLETE_DELAY_MS,
    progressIntervalMs = AUTO_ADVANCE_CONFIG.PROGRESS_UPDATE_INTERVAL_MS,
    enabled = true,
  } = options;

  const [progress, setProgress] = useState(0);
  const [isActive, setIsActive] = useState(false);

  const progressSteps = delayMs / progressIntervalMs;
  const progressIncrement = 100 / progressSteps;

  const reset = useCallback(() => {
    setProgress(0);
    setIsActive(false);
  }, []);

  const cancel = useCallback(() => {
    setIsActive(false);
    setProgress(0);
  }, []);

  const trigger = useCallback(() => {
    if (!enabled) return;

    setProgress(0);
    setIsActive(true);
  }, [enabled]);

  useEffect(() => {
    if (!isActive || !enabled) {
      return;
    }

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + progressIncrement;
        return newProgress >= 100 ? 100 : newProgress;
      });
    }, progressIntervalMs);

    const timer = setTimeout(() => {
      action();
      setIsActive(false);
    }, delayMs);

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [isActive, enabled, action, delayMs, progressIntervalMs, progressIncrement]);

  // Reset when disabled
  useEffect(() => {
    if (!enabled) {
      reset();
    }
  }, [enabled, reset]);

  return {
    progress,
    isActive,
    trigger,
    cancel,
    reset,
  };
}
