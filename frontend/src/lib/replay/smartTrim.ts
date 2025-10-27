/**
 * Smart Trim Utility
 * 
 * Automatically detects when ball appears/disappears in recording
 * to eliminate user timing errors from manual START/STOP.
 * 
 * Post-processes recorded frames to find first and last ball detection,
 * then provides trim indices for relevant portion.
 */

import type { TrajectoryPoint } from '../types';
import type { TrimResult } from './types';

/**
 * Analyzes trajectory points to find first and last ball detections
 * 
 * @param trajectoryPoints - Array of trajectory points (null = no detection)
 * @returns TrimResult with first/last indices and efficiency metrics
 * @throws Error if no ball detected in recording
 */
export function smartTrim(trajectoryPoints: (TrajectoryPoint | null)[]): TrimResult {
  const totalFrames = trajectoryPoints.length;

  if (totalFrames === 0) {
    throw new Error('No frames in recording');
  }

  // Find first non-null detection
  const firstIdx = trajectoryPoints.findIndex(p => p !== null);
  
  // Find last non-null detection (search from end)
  let lastIdx = -1;
  for (let i = trajectoryPoints.length - 1; i >= 0; i--) {
    if (trajectoryPoints[i] !== null) {
      lastIdx = i;
      break;
    }
  }
  
  // No ball detected at all
  if (firstIdx === -1 || lastIdx === -1) {
    throw new Error('No ball detected in recording. Try recording again with better lighting.');
  }

  const trimmedFrames = lastIdx - firstIdx + 1;
  const efficiency = (trimmedFrames / totalFrames) * 100;

  // Generate warnings based on efficiency
  let warning: string | undefined;
  if (trimmedFrames < 10) {
    warning = `Very short delivery (${trimmedFrames} frames). Recording may have started too late or ended too early.`;
  } else if (efficiency < 20) {
    warning = `Recording started very early (${efficiency.toFixed(0)}% efficiency). Consider starting closer to ball release.`;
  } else if (efficiency < 40) {
    warning = `Recording includes extra frames (${efficiency.toFixed(0)}% efficiency). Trimmed to relevant portion.`;
  }

  return {
    firstDetectionIndex: firstIdx,
    lastDetectionIndex: lastIdx,
    totalFrames,
    trimmedFrames,
    efficiency,
    warning
  };
}

/**
 * Extracts trimmed trajectory segment from full recording
 * 
 * @param trajectoryPoints - Full trajectory array
 * @param trimResult - Result from smartTrim()
 * @returns Trimmed trajectory segment (non-null points only)
 */
export function extractTrimmedTrajectory(
  trajectoryPoints: (TrajectoryPoint | null)[],
  trimResult: TrimResult
): TrajectoryPoint[] {
  const { firstDetectionIndex, lastDetectionIndex } = trimResult;
  
  return trajectoryPoints
    .slice(firstDetectionIndex, lastDetectionIndex + 1)
    .filter((p): p is TrajectoryPoint => p !== null);
}

/**
 * Checks if a frame index is within the trimmed (relevant) portion
 * 
 * @param frameIndex - Frame index to check
 * @param trimResult - Result from smartTrim()
 * @returns true if frame is in relevant portion
 */
export function isFrameInTrimmedRange(
  frameIndex: number,
  trimResult: TrimResult
): boolean {
  return frameIndex >= trimResult.firstDetectionIndex 
      && frameIndex <= trimResult.lastDetectionIndex;
}

/**
 * Calculates relative frame position within trimmed segment
 * 
 * @param absoluteFrameIndex - Frame index in full recording
 * @param trimResult - Result from smartTrim()
 * @returns Frame index relative to trimmed segment (0-based)
 */
export function absoluteToTrimmedIndex(
  absoluteFrameIndex: number,
  trimResult: TrimResult
): number {
  if (!isFrameInTrimmedRange(absoluteFrameIndex, trimResult)) {
    return -1;
  }
  
  return absoluteFrameIndex - trimResult.firstDetectionIndex;
}

/**
 * Calculates absolute frame position from trimmed segment position
 * 
 * @param trimmedFrameIndex - Frame index within trimmed segment
 * @param trimResult - Result from smartTrim()
 * @returns Absolute frame index in full recording
 */
export function trimmedToAbsoluteIndex(
  trimmedFrameIndex: number,
  trimResult: TrimResult
): number {
  if (trimmedFrameIndex < 0 || trimmedFrameIndex >= trimResult.trimmedFrames) {
    return -1;
  }
  
  return trimResult.firstDetectionIndex + trimmedFrameIndex;
}

/**
 * Formats trim efficiency for display
 * 
 * @param trimResult - Result from smartTrim()
 * @returns Formatted string like "70/120 frames (58%)"
 */
export function formatTrimEfficiency(trimResult: TrimResult): string {
  return `${trimResult.trimmedFrames}/${trimResult.totalFrames} frames (${trimResult.efficiency.toFixed(0)}%)`;
}

/**
 * Gets timeline zone for a given frame index
 * 
 * @param frameIndex - Frame index to classify
 * @param trimResult - Result from smartTrim()
 * @returns 'pre-ball' | 'relevant' | 'post-ball'
 */
export function getTimelineZone(
  frameIndex: number,
  trimResult: TrimResult
): 'pre-ball' | 'relevant' | 'post-ball' {
  if (frameIndex < trimResult.firstDetectionIndex) {
    return 'pre-ball';
  } else if (frameIndex <= trimResult.lastDetectionIndex) {
    return 'relevant';
  } else {
    return 'post-ball';
  }
}
