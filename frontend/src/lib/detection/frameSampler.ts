/**
 * Frame Sampling Helper
 * 
 * Provides utilities for intelligent frame sampling from video streams
 * to balance detection accuracy with performance.
 * 
 * Strategy: Sample every Nth frame to reduce computational load while
 * maintaining sufficient temporal resolution for speed calculation.
 */

import type { FrameSample } from '../types';

/**
 * Frame sampling strategy configuration
 */
export interface SamplingConfig {
  /**
   * Sample every Nth frame (e.g., 2 = every 2nd frame)
   * Default: 2 (sample at 15fps from 30fps source)
   */
  interval: number;

  /**
   * Maximum number of frames to sample
   * Useful for limiting processing on long captures
   */
  maxFrames?: number;

  /**
   * Minimum number of frames required
   * Ensures we have enough data for analysis
   */
  minFrames?: number;

  /**
   * Whether to always include the first frame
   * Useful for capturing ball release point
   */
  includeFirst?: boolean;

  /**
   * Whether to always include the last frame
   * Useful for capturing ball at impact/end
   */
  includeLast?: boolean;
}

/**
 * Default sampling configuration
 * Based on research: every 2nd frame at 30fps = 15fps effective
 */
export const DEFAULT_SAMPLING_CONFIG: SamplingConfig = {
  interval: 2,
  maxFrames: 45, // ~3 seconds at 15fps
  minFrames: 5,
  includeFirst: true,
  includeLast: true,
};

/**
 * Sample frames from a collection based on the provided strategy
 * 
 * @param frames - All available frames from video capture
 * @param config - Sampling configuration (uses defaults if not provided)
 * @returns Sampled subset of frames
 */
export function sampleFrames(
  frames: FrameSample[],
  config: Partial<SamplingConfig> = {}
): FrameSample[] {
  const fullConfig = { ...DEFAULT_SAMPLING_CONFIG, ...config };

  // Handle empty or insufficient frames
  if (frames.length === 0) {
    return [];
  }

  if (frames.length <= (fullConfig.minFrames ?? 0)) {
    // If we have fewer frames than minimum, return all
    return [...frames];
  }

  const sampled: FrameSample[] = [];
  const { interval, maxFrames, includeFirst, includeLast } = fullConfig;

  // Always include first frame if configured
  if (includeFirst && frames.length > 0) {
    sampled.push(frames[0]);
  }

  // Sample frames at intervals
  const startIndex = includeFirst ? interval : 0;
  const endIndex = includeLast ? frames.length - 1 : frames.length;

  for (let i = startIndex; i < endIndex; i += interval) {
    // Skip first frame if already included
    if (i === 0 && includeFirst) {
      continue;
    }

    sampled.push(frames[i]);

    // Stop if we've reached max frames (accounting for last frame if configured)
    if (maxFrames && sampled.length >= maxFrames - (includeLast ? 1 : 0)) {
      break;
    }
  }

  // Always include last frame if configured and not already included
  if (includeLast && frames.length > 0) {
    const lastFrame = frames[frames.length - 1];
    const lastSampled = sampled[sampled.length - 1];

    if (!lastSampled || lastSampled.frameIndex !== lastFrame.frameIndex) {
      sampled.push(lastFrame);
    }
  }

  return sampled;
}

/**
 * Create a sampling configuration optimized for different scenarios
 */
export const SamplingPresets = {
  /**
   * High accuracy: Sample every frame (no sampling)
   * Use for: High-end devices, short captures, critical measurements
   */
  HIGH_ACCURACY: {
    interval: 1,
    maxFrames: 90, // ~3 seconds at 30fps
    includeFirst: true,
    includeLast: true,
  } as SamplingConfig,

  /**
   * Balanced: Sample every 2nd frame (default)
   * Use for: Standard mobile devices, typical deliveries
   */
  BALANCED: DEFAULT_SAMPLING_CONFIG,

  /**
   * Performance: Sample every 3rd frame
   * Use for: Lower-end devices, longer captures
   */
  PERFORMANCE: {
    interval: 3,
    maxFrames: 30, // ~3 seconds at 10fps
    minFrames: 3,
    includeFirst: true,
    includeLast: true,
  } as SamplingConfig,

  /**
   * Fast preview: Sample every 5th frame
   * Use for: Quick analysis, UI previews
   */
  FAST_PREVIEW: {
    interval: 5,
    maxFrames: 20,
    minFrames: 2,
    includeFirst: true,
    includeLast: true,
  } as SamplingConfig,
};

/**
 * Calculate effective frame rate after sampling
 * 
 * @param sourceFrameRate - Original video frame rate (e.g., 30)
 * @param samplingInterval - Sampling interval (e.g., 2 for every 2nd frame)
 * @returns Effective frame rate after sampling
 */
export function getEffectiveFrameRate(
  sourceFrameRate: number,
  samplingInterval: number
): number {
  return sourceFrameRate / samplingInterval;
}

/**
 * Estimate processing time based on frame count and per-frame latency
 * 
 * @param frameCount - Number of frames to process
 * @param perFrameMs - Average processing time per frame in milliseconds
 * @returns Estimated total processing time in milliseconds
 */
export function estimateProcessingTime(
  frameCount: number,
  perFrameMs: number = 50 // Default assumption: 50ms/frame
): number {
  return frameCount * perFrameMs;
}

/**
 * Determine if sampling should be applied based on device capabilities
 * 
 * @param deviceTier - Device performance tier ('low' | 'medium' | 'high')
 * @returns Recommended sampling configuration
 */
export function getRecommendedSampling(
  deviceTier: 'low' | 'medium' | 'high' = 'medium'
): SamplingConfig {
  switch (deviceTier) {
    case 'high':
      return SamplingPresets.HIGH_ACCURACY;
    case 'low':
      return SamplingPresets.PERFORMANCE;
    case 'medium':
    default:
      return SamplingPresets.BALANCED;
  }
}

/**
 * Validate that sampled frames meet minimum requirements
 * 
 * @param frames - Sampled frames
 * @param minFrames - Minimum required frames
 * @returns true if requirements met, false otherwise
 */
export function validateSampledFrames(
  frames: FrameSample[],
  minFrames: number = 2
): boolean {
  if (frames.length < minFrames) {
    return false;
  }

  // Ensure frames are in chronological order
  for (let i = 1; i < frames.length; i++) {
    if (frames[i].timestampMs <= frames[i - 1].timestampMs) {
      return false;
    }
  }

  return true;
}
