/**
 * useAutoStop Hook
 * 
 * Automatically stops recording when the ball is not detected for a
 * configurable number of consecutive frames. Implements hybrid workflow:
 * - Manual START (user clicks button)
 * - Auto STOP (ball exits frame)
 * 
 * Features:
 * - Configurable threshold (15/30/60 frames)
 * - Safety timeout (10s max recording)
 * - Minimum frames before auto-stop can trigger
 * - Countdown progress for UI feedback
 * - Ball reappearing resets countdown
 * 
 * Performance: <5ms overhead per frame
 * Memory: ~100 bytes additional
 * 
 * @see T10 - Hybrid Auto-Stop implementation
 */

import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Configuration for auto-stop behavior
 */
export interface AutoStopConfig {
  /** Enable auto-stop detection */
  enabled: boolean;
  /** Number of consecutive empty frames before auto-stop */
  threshold: number;
  /** Minimum total frames before auto-stop can trigger */
  minFrames: number;
  /** Maximum recording duration in milliseconds (safety timeout) */
  safetyTimeout: number;
}

/**
 * Reason why recording stopped
 */
export type StopReason = 'auto-stop' | 'manual-stop' | 'timeout' | null;

/**
 * Current state of auto-stop detection
 */
export interface AutoStopState {
  /** Whether auto-stop detection is currently active */
  isActive: boolean;
  /** Number of consecutive frames without ball detection */
  consecutiveEmptyFrames: number;
  /** Total frames processed (with or without detection) */
  totalFrames: number;
  /** Whether auto-stop should trigger */
  shouldStop: boolean;
  /** Progress toward threshold (0-1 for UI) */
  countdownProgress: number;
  /** Reason for stopping */
  reason: StopReason;
  /** Frames remaining until auto-stop */
  framesRemaining: number;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: AutoStopConfig = {
  enabled: true,
  threshold: 30, // ~1s at 30 FPS
  minFrames: 10,
  safetyTimeout: 10000, // 10 seconds
};

/**
 * Hook for automatic recording stop detection
 * 
 * @param config - Auto-stop configuration
 * @returns Auto-stop state and control functions
 * 
 * @example
 * ```tsx
 * const { state, onFrame, reset } = useAutoStop({
 *   enabled: true,
 *   threshold: 30,
 *   minFrames: 10,
 *   safetyTimeout: 10000
 * });
 * 
 * // On each frame during recording
 * useEffect(() => {
 *   if (isRecording && detectionResult) {
 *     const hasDetection = detectionResult !== null;
 *     onFrame(hasDetection);
 *   }
 * }, [isRecording, detectionResult]);
 * 
 * // Watch for auto-stop trigger
 * useEffect(() => {
 *   if (state.shouldStop) {
 *     handleStopRecording('auto');
 *   }
 * }, [state.shouldStop]);
 * ```
 */
export function useAutoStop(config: Partial<AutoStopConfig> = {}) {
  const finalConfig: AutoStopConfig = { ...DEFAULT_CONFIG, ...config };

  const [state, setState] = useState<AutoStopState>({
    isActive: false,
    consecutiveEmptyFrames: 0,
    totalFrames: 0,
    shouldStop: false,
    countdownProgress: 0,
    reason: null,
    framesRemaining: finalConfig.threshold,
  });

  // Track start time for safety timeout
  const startTimeRef = useRef<number | null>(null);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Process a frame and update auto-stop state
   * 
   * @param hasDetection - Whether the current frame has a ball detection
   */
  const onFrame = useCallback(
    (hasDetection: boolean) => {
      if (!finalConfig.enabled) return;

      setState((prev) => {
        const newTotalFrames = prev.totalFrames + 1;
        const newConsecutiveEmpty = hasDetection ? 0 : prev.consecutiveEmptyFrames + 1;

        // Calculate progress (0-1)
        const progress = Math.min(newConsecutiveEmpty / finalConfig.threshold, 1);
        const framesRemaining = Math.max(finalConfig.threshold - newConsecutiveEmpty, 0);

        // Check if auto-stop should trigger
        const hasEnoughFrames = newTotalFrames >= finalConfig.minFrames;
        const thresholdReached = newConsecutiveEmpty >= finalConfig.threshold;
        const shouldTriggerStop = hasEnoughFrames && thresholdReached && !prev.shouldStop;

        return {
          isActive: true,
          consecutiveEmptyFrames: newConsecutiveEmpty,
          totalFrames: newTotalFrames,
          shouldStop: shouldTriggerStop || prev.shouldStop,
          countdownProgress: progress,
          reason: shouldTriggerStop ? 'auto-stop' : prev.reason,
          framesRemaining,
        };
      });
    },
    [finalConfig.enabled, finalConfig.threshold, finalConfig.minFrames]
  );

  /**
   * Reset auto-stop state
   */
  const reset = useCallback(() => {
    setState({
      isActive: false,
      consecutiveEmptyFrames: 0,
      totalFrames: 0,
      shouldStop: false,
      countdownProgress: 0,
      reason: null,
      framesRemaining: finalConfig.threshold,
    });
    startTimeRef.current = null;
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
  }, [finalConfig.threshold]);

  /**
   * Start the safety timeout when recording begins
   */
  const startTimeout = useCallback(() => {
    if (!finalConfig.enabled || timeoutIdRef.current) return;

    startTimeRef.current = Date.now();
    timeoutIdRef.current = setTimeout(() => {
      setState((prev) => ({
        ...prev,
        shouldStop: true,
        reason: 'timeout',
      }));
    }, finalConfig.safetyTimeout);
  }, [finalConfig.enabled, finalConfig.safetyTimeout]);

  /**
   * Stop the safety timeout
   */
  const stopTimeout = useCallback(() => {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
    startTimeRef.current = null;
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, []);

  return {
    state,
    onFrame,
    reset,
    startTimeout,
    stopTimeout,
  };
}

/**
 * Get recommended threshold based on camera FPS
 * 
 * @param fps - Camera frames per second
 * @returns Recommended threshold (frames)
 */
export function getRecommendedThreshold(fps: number): number {
  if (fps >= 60) return 60; // 1s at 60 FPS
  if (fps >= 30) return 30; // 1s at 30 FPS
  return 15; // 0.5s fallback for very low FPS
}

/**
 * Format frames remaining as time string
 * 
 * @param frames - Frames remaining
 * @param fps - Camera FPS
 * @returns Formatted string (e.g., "1.0s")
 */
export function formatFramesAsTime(frames: number, fps: number = 30): string {
  const seconds = frames / fps;
  return `${seconds.toFixed(1)}s`;
}

/**
 * Preset configurations for common use cases
 */
export const AUTO_STOP_PRESETS = {
  quick: {
    name: 'Quick',
    description: 'For short pitches or fast returns',
    threshold: 15,
  },
  normal: {
    name: 'Normal',
    description: 'Recommended for most recordings',
    threshold: 30,
  },
  patient: {
    name: 'Patient',
    description: 'For slow-motion cameras or longer deliveries',
    threshold: 60,
  },
} as const;

export type AutoStopPreset = keyof typeof AUTO_STOP_PRESETS;
