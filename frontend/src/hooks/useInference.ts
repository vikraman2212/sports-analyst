/**
 * useInference Hook
 * 
 * Manages ball detection and delivery analysis for cricket ball tracking.
 * 
 * This hook orchestrates the complete inference pipeline:
 * 1. Collect frames from camera feed
 * 2. Run detection on frames (via analyzeDelivery)
 * 3. Calculate speed and trajectory
 * 4. Provide results with confidence scores
 * 
 * Based on plan.md:
 * - Target: <5s post-delivery result latency
 * - Goal: <100ms inference per frame on mid-range devices
 * - Frame sampling to reduce processing load
 * - ROI cropping for optimization
 */

import { useState, useCallback, useRef } from 'react';
import type { FrameSample, CalibrationProfile, DeliveryResult } from '../lib/types';
import { analyzeDelivery } from '../lib/analyzeDelivery';
import { sampleFrames } from '../lib/detection/frameSampler';

/**
 * Inference configuration options
 */
export interface InferenceConfig {
  /**
   * Target frame rate for sampling (frames per second)
   * Lower values reduce processing load
   * @default 30
   */
  targetFrameRate?: number;

  /**
   * Maximum number of frames to analyze in a single delivery
   * Helps limit processing time
   * @default 90 (3 seconds at 30fps)
   */
  maxFrames?: number;

  /**
   * Whether to use frame sampling to reduce load
   * @default true
   */
  useSampling?: boolean;
}

/**
 * Inference state
 */
export interface InferenceState {
  /**
   * Whether analysis is currently in progress
   */
  isAnalyzing: boolean;

  /**
   * Whether the hook is ready to analyze (detector initialized)
   */
  isReady: boolean;

  /**
   * Current delivery result (null if no analysis complete)
   */
  result: DeliveryResult | null;

  /**
   * Error message if analysis failed
   */
  error: string | null;

  /**
   * Number of frames collected for current delivery
   */
  frameCount: number;

  /**
   * Progress percentage (0-100) during analysis
   */
  progress: number;
}

/**
 * Inference actions
 */
export interface InferenceActions {
  /**
   * Start collecting frames for a delivery
   */
  startRecording: () => void;

  /**
   * Stop collecting frames and run analysis
   */
  stopAndAnalyze: (calibration: CalibrationProfile) => Promise<void>;

  /**
   * Add a frame to the current collection
   */
  addFrame: (frame: FrameSample) => void;

  /**
   * Reset state and clear results
   */
  reset: () => void;

  /**
   * Cancel ongoing analysis
   */
  cancel: () => void;
}

/**
 * Default inference configuration
 */
const DEFAULT_CONFIG: Required<InferenceConfig> = {
  targetFrameRate: 30,
  maxFrames: 90, // 3 seconds at 30fps
  useSampling: true,
};

/**
 * useInference Hook
 * 
 * Manages the delivery analysis pipeline from frame collection to result calculation.
 * 
 * @param config - Optional inference configuration
 * @returns Inference state and actions
 * 
 * @example
 * ```tsx
 * const { isAnalyzing, result, startRecording, stopAndAnalyze, addFrame } = useInference();
 * 
 * // Start recording
 * startRecording();
 * 
 * // Collect frames from camera
 * const frame = captureFrame();
 * if (frame) addFrame(frame);
 * 
 * // Stop and analyze
 * await stopAndAnalyze(calibration);
 * 
 * // Display result
 * if (result) {
 *   console.log(`Speed: ${result.speedKmh} km/h`);
 * }
 * ```
 */
export function useInference(
  config: InferenceConfig = {}
): InferenceState & InferenceActions {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  // State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isReady] = useState(true); // Ready by default (detector lazy-loaded)
  const [result, setResult] = useState<DeliveryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [frameCount, setFrameCount] = useState(0);
  const [progress, setProgress] = useState(0);

  // Refs for mutable state
  const framesRef = useRef<FrameSample[]>([]);
  const isRecordingRef = useRef(false);
  const cancelledRef = useRef(false);

  /**
   * Start collecting frames for a delivery
   */
  const startRecording = useCallback(() => {
    framesRef.current = [];
    setFrameCount(0);
    setResult(null);
    setError(null);
    setProgress(0);
    isRecordingRef.current = true;
    cancelledRef.current = false;
  }, []);

  /**
   * Add a frame to the current collection
   */
  const addFrame = useCallback(
    (frame: FrameSample) => {
      if (!isRecordingRef.current) {
        return;
      }

      // Check if we've reached max frames
      if (framesRef.current.length >= mergedConfig.maxFrames) {
        console.warn(
          `Maximum frame count (${mergedConfig.maxFrames}) reached. Stopping collection.`
        );
        isRecordingRef.current = false;
        return;
      }

      framesRef.current.push(frame);
      setFrameCount(framesRef.current.length);
    },
    [mergedConfig.maxFrames]
  );

  /**
   * Stop collecting frames and run analysis
   */
  const stopAndAnalyze = useCallback(
    async (calibration: CalibrationProfile) => {
      // Stop recording
      isRecordingRef.current = false;

      // Get collected frames
      const collectedFrames = framesRef.current;

      if (collectedFrames.length === 0) {
        setError('No frames collected. Please record a delivery first.');
        return;
      }

      try {
        setIsAnalyzing(true);
        setError(null);
        setProgress(10);
        cancelledRef.current = false;

        // Sample frames if configured
        const framesToAnalyze = mergedConfig.useSampling
          ? sampleFrames(collectedFrames, {
              interval: Math.max(1, Math.round(30 / mergedConfig.targetFrameRate)),
              maxFrames: mergedConfig.maxFrames,
            })
          : collectedFrames;

        if (cancelledRef.current) {
          return;
        }

        setProgress(30);

        // Run analysis
        const analysisResult = await analyzeDelivery(framesToAnalyze, calibration);

        if (cancelledRef.current) {
          return;
        }

        setProgress(100);
        setResult(analysisResult);
        setIsAnalyzing(false);
      } catch (err) {
        if (cancelledRef.current) {
          return;
        }

        const errorMessage = err instanceof Error ? err.message : 'Analysis failed';
        setError(errorMessage);
        setIsAnalyzing(false);
        setProgress(0);
        console.error('Inference error:', err);
      }
    },
    [mergedConfig.useSampling, mergedConfig.targetFrameRate, mergedConfig.maxFrames]
  );

  /**
   * Reset state and clear results
   */
  const reset = useCallback(() => {
    framesRef.current = [];
    isRecordingRef.current = false;
    cancelledRef.current = false;
    setFrameCount(0);
    setResult(null);
    setError(null);
    setProgress(0);
    setIsAnalyzing(false);
  }, []);

  /**
   * Cancel ongoing analysis
   */
  const cancel = useCallback(() => {
    cancelledRef.current = true;
    isRecordingRef.current = false;
    setIsAnalyzing(false);
    setProgress(0);
  }, []);

  return {
    // State
    isAnalyzing,
    isReady,
    result,
    error,
    frameCount,
    progress,

    // Actions
    startRecording,
    stopAndAnalyze,
    addFrame,
    reset,
    cancel,
  };
}

/**
 * Get user-friendly error message for inference errors
 */
export function getInferenceErrorMessage(error: Error | string): string {
  const message = typeof error === 'string' ? error : error.message;

  if (message.includes('Insufficient detections')) {
    return 'Could not detect ball in enough frames. Please ensure good lighting and clear ball visibility.';
  }

  if (message.includes('calibration')) {
    return 'Invalid calibration data. Please calibrate the camera first.';
  }

  if (message.includes('No frames')) {
    return 'No video frames available. Please record a delivery first.';
  }

  return `Analysis failed: ${message}`;
}
